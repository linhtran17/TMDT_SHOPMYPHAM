import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { InventoryService } from '../../../core/services/inventory.service';
import { MovementCreateRequest, InventoryReason } from '../../../core/models/inventory.model';
import { SupplierService } from '../../../core/services/supplier.service';
import { ProductService } from '../../../core/services/product.service';

type SupplierLite = { id: number; name: string };
type VariantLite  = { id: number; sku: string; options?: Record<string,string> | null };
type ProductLite  = { id: number; name: string; hasVariants?: boolean; sku?: string | null };

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .wrap{ @apply max-w-3xl mx-auto p-4 md:p-6; }
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm; }
    .body{ @apply p-4 md:p-6 grid gap-4; }
    .row2{ @apply grid md:grid-cols-2 gap-3; }
    .inp{ @apply w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .inp.err{ @apply border-rose-400 focus:ring-rose-300; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700; }
    .label{ @apply text-sm font-medium text-slate-800; }
    .hint{ @apply text-[12px] text-slate-500 mt-1; }
    .err-msg{ @apply text-[12px] text-rose-600 mt-1; }

    /* autocomplete */
    .ac{ @apply relative; }
    .list{ @apply absolute z-20 left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg max-h-64 overflow-auto; }
    .item{ @apply px-3 py-2 text-sm hover:bg-rose-50 cursor-pointer; }

    .footer{ @apply p-4 md:p-6 border-t flex justify-end gap-2; }

    /* error banner */
    .banner{ @apply mx-4 md:mx-6 mt-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 p-3 text-sm; }
  `],
  template: `
  <div class="wrap">
    <div class="flex items-center justify-between mb-3">
      <h1 class="text-2xl font-extrabold">Ghi sổ kho</h1>
      <a class="btn" [routerLink]="['/admin/inventory']">← Danh sách</a>
    </div>

    <div class="card">

      <!-- Banner lỗi tổng quát -->
      <div class="banner" *ngIf="firstError()">
        {{ firstError() }}
      </div>

      <div class="body">

        <!-- Chọn sản phẩm -->
        <div class="ac">
          <label class="label">Sản phẩm*</label>
          <input class="inp" [class.err]="errors().productId" type="text"
                 [(ngModel)]="prodQuery" (ngModelChange)="debouncedProd()"
                 placeholder="Nhập tên sản phẩm để tìm…">
          <div class="err-msg" *ngIf="errors().productId">{{ errors().productId }}</div>

          <div class="hint" *ngIf="selectedProduct() as p">
            Đã chọn: <b>{{ p.name }}</b> (ID: {{ p.id }})
            <button class="btn ml-2" (click)="clearProduct()">Đổi</button>
          </div>

          <div class="list" *ngIf="showProdList()">
            <div class="item" *ngFor="let p of prodResults()" (click)="pickProduct(p)">
              {{ p.name }}
              <span class="text-slate-400">#{{p.id}}</span>
              <span class="text-emerald-600 text-xs ml-1" *ngIf="p.hasVariants">• có biến thể</span>
            </div>
            <div class="item text-slate-500" *ngIf="!prodResults().length">Không tìm thấy</div>
          </div>
        </div>

        <!-- Biến thể (hiện khi sản phẩm có biến thể) -->
        <div *ngIf="variants().length">
          <label class="label">Biến thể*</label>
          <select class="inp" [class.err]="errors().variantId" [(ngModel)]="selectedVariantId">
            <option [ngValue]="null" disabled>— Chọn biến thể —</option>
            <option *ngFor="let v of variants()" [ngValue]="v.id">
              {{ v.sku }} • {{ optionsToText(v.options) }}
            </option>
          </select>
          <div class="err-msg" *ngIf="errors().variantId">{{ errors().variantId }}</div>
          <div class="hint">Sản phẩm này có biến thể, vui lòng chọn đúng biến thể để ghi sổ.</div>
        </div>

        <!-- Lý do & Số lượng -->
        <div class="row2">
          <div>
            <label class="label">Lý do*</label>
            <select class="inp" [(ngModel)]="form.reason" (change)="onReasonChange()">
              <option *ngFor="let r of reasons" [ngValue]="r">{{ REASON_LABELS[r] }}</option>
            </select>
          </div>
          <div>
            <label class="label">Số lượng (+ nhập / - xuất)*</label>
            <input class="inp" [class.err]="errors().changeQty" type="number"
                   [(ngModel)]="form.changeQty" placeholder="Ví dụ: +10 hoặc -5">
            <div class="err-msg" *ngIf="errors().changeQty">{{ errors().changeQty }}</div>
          </div>
        </div>

        <!-- Nhà cung cấp & Đơn giá -->
        <div class="row2">
          <!-- Nhà cung cấp -->
          <div>
            <label class="label">
              Nhà cung cấp <span *ngIf="requireSupplier()">*</span>
            </label>

            <div class="row2">
              <!-- ô tìm theo tên -->
              <input
                class="inp"
                type="text"
                [(ngModel)]="supQuery"
                (ngModelChange)="debouncedSup()"
                (focus)="ensureSuppliersLoaded()"
                placeholder="Tìm theo tên NCC… (để trống sẽ hiện danh sách)"
              >

              <!-- combobox luôn hiển thị -->
              <select class="inp" [class.err]="errors().supplierId" [(ngModel)]="selectedSupplierId">
                <option [ngValue]="null">
                  — {{ supResults().length ? 'Chọn nhà cung cấp' : 'Không có kết quả' }} —
                </option>
                <option *ngFor="let s of supResults()" [ngValue]="s.id">{{ s.name }}</option>
              </select>
            </div>

            <div class="err-msg" *ngIf="errors().supplierId">{{ errors().supplierId }}</div>

            <div class="flex items-center gap-2 mt-2">
              <button class="btn" (click)="openNewSupplier()">+ Thêm NCC mới</button>
              <span class="hint" *ngIf="requireSupplier()">
                * Bắt buộc khi {{ REASON_LABELS['purchase'] }} hoặc {{ REASON_LABELS['purchase_return'] }}.
              </span>
            </div>
          </div>

          <!-- Đơn giá -->
          <div>
            <label class="label">Đơn giá (nếu có)</label>
            <input class="inp" [class.err]="errors().unitCost" type="number"
                   [(ngModel)]="form.unitCost" placeholder="đơn giá nhập (đ)">
            <div class="err-msg" *ngIf="errors().unitCost">{{ errors().unitCost }}</div>
            <div class="hint">Dùng khi Nhập/Trả NCC để lưu giá vốn (tuỳ chọn).</div>
          </div>
        </div>

        <!-- Chứng từ -->
        <div class="row2">
          <div>
            <label class="label">Doc No</label>
            <input class="inp" [(ngModel)]="form.docNo" placeholder="VD: PN-0001">
          </div>
          <div>
            <label class="label">Ref ID</label>
            <input class="inp" type="number" [(ngModel)]="form.refId" placeholder="Tham chiếu đơn hàng / phiếu">
          </div>
        </div>
      </div>

      <div class="footer">
        <a class="btn" [routerLink]="['/admin/inventory']">Huỷ</a>
        <button class="btn btn-primary" (click)="submit()" [disabled]="saving()">Ghi sổ</button>
      </div>
    </div>
  </div>
  `
})
export class AdminInventoryNewPageComponent {
  private inv = inject(InventoryService);
  private prodSvc = inject(ProductService);
  private supplierSvc = inject(SupplierService);
  private router = inject(Router);

  // ===== state: product =====
  prodQuery = ''; tProd?: any;
  prodResults = signal<ProductLite[]>([]);
  selectedProduct = signal<ProductLite | null>(null);

  variants = signal<VariantLite[]>([]);
  selectedVariantId: number | null = null;

  // ===== state: supplier =====
  supQuery = ''; tSup?: any;
  supResults = signal<SupplierLite[]>([]);
  selectedSupplierId: number | null = null;

  // ===== reasons =====
  reasons: InventoryReason[] = ['purchase','purchase_return','order','refund','adjustment','manual','initial','cancel'];
  readonly REASON_LABELS: Record<InventoryReason,string> = {
    purchase: 'Nhập NCC',
    purchase_return: 'Trả NCC',
    order: 'Bán hàng (xuất)',
    refund: 'Khách trả (nhập)',
    adjustment: 'Điều chỉnh',
    manual: 'Thủ công',
    initial: 'Khởi tạo tồn',
    cancel: 'Huỷ đơn (nhập lại)'
  };

  // ===== form =====
  form: MovementCreateRequest = {
    productId: 0,
    variantId: null,
    changeQty: 0,
    reason: 'manual',
    supplierId: null,
    refId: null,
    unitCost: null,
    docNo: null
  };

  // ===== errors =====
  errors = signal<{
    productId?: string | null;
    variantId?: string | null;
    changeQty?: string | null;
    supplierId?: string | null;
    unitCost?: string | null;
    _api?: string | null;     // lỗi trả về từ API
  }>({});

  firstError(){
    const e = this.errors();
    return e._api || e.productId || e.variantId || e.changeQty || e.supplierId || e.unitCost || null;
  }

  // ========= Product search =========
  debouncedProd(){ clearTimeout(this.tProd); this.tProd = setTimeout(()=> this.searchProducts(), 300); }
  showProdList(){ return !!this.prodQuery && !this.selectedProduct(); }

  searchProducts(){
    const q = (this.prodQuery || '').trim();
    if (!q){ this.prodResults.set([]); return; }
    this.prodSvc.searchLite(q).subscribe({
      next: (list: {id:number; name:string; hasVariants:boolean}[]) => this.prodResults.set(list || []),
      error: () => this.prodResults.set([])
    });
  }

  pickProduct(p: ProductLite){
    this.selectedProduct.set(p);
    this.prodQuery = `${p.name}`;
    this.prodResults.set([]);
    this.form.productId = p.id;
    this.errors.update(x => ({ ...x, productId: null }));

    // tải variants
    this.variants.set([]);
    this.selectedVariantId = null;
    this.prodSvc.get(p.id).subscribe({
      next: (detail: any) => {
        const vs = (detail?.variants || []).map((v: any) => ({
          id: v.id, sku: v.sku, options: v.options || null
        })) as VariantLite[];
        this.variants.set(vs);
      },
      error: () => this.variants.set([])
    });
  }

  clearProduct(){
    this.selectedProduct.set(null);
    this.prodQuery = '';
    this.form.productId = 0;
    this.variants.set([]);
    this.selectedVariantId = null;
  }

  optionsToText(opts?: Record<string,string> | null){
    if (!opts) return '';
    return Object.entries(opts).map(([k,v]) => `${k}:${v}`).join(' • ');
  }

  // ========= Supplier search =========
  ngOnInit(){ this.loadSuppliersFirstPage(); }

  ensureSuppliersLoaded(){
    if (!this.supResults().length) this.loadSuppliersFirstPage();
  }

  loadSuppliersFirstPage(){
    this.supplierSvc.search({ q: '', page: 0, size: 50 }).subscribe({
      next: (res: any) => {
        const items = res?.items ?? res?.content ?? res ?? [];
        this.supResults.set(items.map((x: any) => ({ id: x.id, name: x.name })));
      },
      error: () => this.supResults.set([])
    });
  }

  debouncedSup(){
    clearTimeout(this.tSup);
    this.tSup = setTimeout(() => this.searchSuppliers(), 300);
  }

  searchSuppliers(){
    // rỗng -> trang đầu (gợi ý)
    if (!this.supQuery?.trim()) { this.loadSuppliersFirstPage(); return; }
    this.supplierSvc.search({ q: this.supQuery.trim(), page: 0, size: 50 }).subscribe({
      next: (res: any) => {
        const items = res?.items ?? res?.content ?? res ?? [];
        this.supResults.set(items.map((x: any) => ({ id: x.id, name: x.name })));
      },
      error: () => this.supResults.set([])
    });
  }

  openNewSupplier(){ window.open('/admin/suppliers/new', '_blank'); }

  // ========= Logic phụ thuộc lý do =========
  onReasonChange(){
    // xoá lỗi cũ
    this.errors.update(x => ({ ...x, supplierId: null, unitCost: null, _api: null }));
    // bỏ NCC & đơn giá khi không cần
    if (!this.requireSupplier()){
      this.selectedSupplierId = null;
      this.form.unitCost = null;
    }
  }
  requireSupplier(){
    return this.form.reason === 'purchase' || this.form.reason === 'purchase_return';
  }

  // ========= Validate & Submit =========
  saving = signal(false);

  private validate(): boolean {
    const errs: any = {};

    // product bắt buộc
    if (!this.form.productId) {
      errs.productId = 'Vui lòng chọn sản phẩm.';
    }

    // nếu có biến thể → bắt buộc chọn biến thể
    if (this.variants().length && !this.selectedVariantId) {
      errs.variantId = 'Sản phẩm có biến thể — vui lòng chọn 1 biến thể.';
    }

    // changeQty != 0
    const q = Number(this.form.changeQty);
    if (!Number.isFinite(q) || q === 0) {
      errs.changeQty = 'Số lượng phải khác 0 (ví dụ: 10 hoặc -5).';
    }

    // NCC bắt buộc với purchase / purchase_return
    if (this.requireSupplier() && !this.selectedSupplierId) {
      errs.supplierId = 'Lý do liên quan NCC — vui lòng chọn nhà cung cấp.';
    }

    // unitCost không âm (nếu nhập)
    if (this.form.unitCost != null) {
      const c = Number(this.form.unitCost);
      if (!Number.isFinite(c) || c < 0) {
        errs.unitCost = 'Đơn giá phải là số ≥ 0.';
      }
    }

    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  submit(){
    this.errors.update(x => ({ ...x, _api: null }));

    if (!this.validate()) {
      // không gửi nếu có lỗi
      return;
    }

    // gán variant theo lựa chọn
    if (this.variants().length){
      this.form.variantId = this.selectedVariantId!;
    } else {
      this.form.variantId = null;
    }

    // NCC
    this.form.supplierId = this.requireSupplier() ? this.selectedSupplierId : null;

    this.saving.set(true);
    this.inv.create(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/admin/inventory']);
      },
      error: (e) => {
        this.saving.set(false);
        const msg = e?.error?.message || 'Ghi sổ thất bại. Vui lòng thử lại.';
        this.errors.update(x => ({ ...x, _api: msg }));
      }
    });
  }
}
