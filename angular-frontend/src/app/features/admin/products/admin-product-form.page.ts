import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { UploadService } from '../../../core/services/upload.service';
import { InventoryService } from '../../../core/services/inventory.service';

import {
  ProductRequest, ProductResponse, ProductImage,
  ProductVariant, ProductAttribute
} from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { ToastService } from '../../../shared/toast/toast';
import { LoadingOverlayService } from '../../../shared/ui/loading-overlay';

type Option = { id: number | null; label: string; disabled?: boolean };

@Component({
  standalone: true,
  selector: 'app-admin-product-wizard-page',
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .wrap{ @apply max-w-5xl mx-auto; }
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed; }
    .btn-primary{ @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700 disabled:opacity-50; }
    .inp{ @apply w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .grid-2{ @apply grid md:grid-cols-2 gap-4; }
    .thumb{ @apply w-28 h-28 rounded-xl object-cover border; }
    .thumb-sm{ @apply w-10 h-10 rounded object-cover border; }
    .img-card{ @apply p-3 rounded-xl border bg-white shadow-sm; }
    .muted{ @apply text-sm text-slate-500; }
    .chip{ @apply inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-xs; }
    .table-v{ @apply w-full text-sm; }
    .thv{ @apply text-left p-2 bg-slate-50; }
    .tdv{ @apply p-2 border-t; }
    .inp-xs{ @apply w-full rounded border border-slate-200 px-2 py-1 text-xs; }
    .steps{ @apply flex items-center gap-2 my-3; }
    .step{ @apply px-3 py-1.5 rounded-full text-sm border; }
    .on{ @apply bg-rose-600 text-white border-rose-600; }
    .off{ @apply bg-white text-slate-600; }
    .stickybar{ @apply sticky bottom-0 z-10 bg-white/80 backdrop-blur border-t p-3 flex gap-2 justify-end; }
  `],
  template: `
<div class="wrap p-4 md:p-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-extrabold">{{ isEdit() ? 'Sửa sản phẩm' : 'Thêm sản phẩm' }}</h1>
    <a class="btn" [routerLink]="['/admin/products']">← Quay lại</a>
  </div>

  <!-- steps -->
  <div class="steps">
    <span class="step" [class.on]="step()===1" [class.off]="step()!==1">1. Thông tin</span>
    <ng-container *ngIf="form.hasVariants">
      <span class="step" [class.on]="step()===2" [class.off]="step()!==2">2. Thuộc tính</span>
      <span class="step" [class.on]="step()===3" [class.off]="step()!==3">3. Biến thể</span>
    </ng-container>
  </div>

  <!-- STEP 1 -->
  <ng-container *ngIf="step()===1">
    <div class="grid md:grid-cols-3 gap-5">
      <div class="md:col-span-2 card p-4 grid gap-3">
        <div class="grid-2">
          <div>
            <label class="text-sm font-medium">Tên*</label>
            <input class="inp" [(ngModel)]="form.name" name="name" required>
          </div>
          <div>
            <label class="text-sm font-medium">SKU (cha)</label>
            <input class="inp" [(ngModel)]="form.sku" name="sku" placeholder="có thể bỏ trống">
          </div>
        </div>

        <div>
          <label class="text-sm font-medium">Danh mục*</label>
          <select class="inp" [(ngModel)]="form.categoryId" name="categoryId" required>
            <option [ngValue]="null">— Chọn danh mục —</option>
            <option *ngFor="let opt of catOptions()" [ngValue]="opt.id" [disabled]="opt.disabled">{{ opt.label }}</option>
          </select>
          <div class="muted mt-1">Chỉ chọn <b>Danh mục lá</b>. Các danh mục cha bị disable.</div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <label class="flex items-center gap-2"><input type="checkbox" [(ngModel)]="form.featured"> <span>Nổi bật</span></label>
          <label class="flex items-center gap-2">
            <input type="checkbox" [(ngModel)]="form.active">
            <span>{{ form.active ? 'Hiển thị' : 'Ẩn' }}</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" [(ngModel)]="form.hasVariants" (ngModelChange)="onHasVariantsToggle($event)">
            <span>Dùng biến thể</span>
          </label>
        </div>

        <!-- Giá chỉ yêu cầu khi KHÔNG dùng biến thể -->
        <div class="grid-2" *ngIf="!form.hasVariants">
          <div>
            <label class="text-sm font-medium">Giá*</label>
            <input class="inp" type="number" min="0" [(ngModel)]="form.price">
          </div>
          <div>
            <label class="text-sm font-medium">Giá KM (≤ Giá)</label>
            <input class="inp" type="number" min="0" [(ngModel)]="form.salePrice">
          </div>
        </div>

        <div class="muted -mt-2">
          * Tồn kho không nhập ở đây. Vui lòng vào mục <b>Nhập kho</b> / <b>Điều chỉnh</b> để ghi sổ.
          <ng-container *ngIf="isEdit()">
            | Tồn hiện tại: <b>{{ currentStock() }}</b>
          </ng-container>
        </div>

        <div>
          <label class="text-sm font-medium">Mô tả ngắn</label>
          <textarea class="inp" rows="2" [(ngModel)]="form.shortDesc" placeholder="Hiển thị trên danh sách/SEO"></textarea>
        </div>

        <div>
          <label class="text-sm font-medium">Mô tả chi tiết</label>
          <textarea class="inp" rows="5" [(ngModel)]="form.description"></textarea>
        </div>
      </div>

      <!-- Ảnh (cấp sản phẩm) -->
      <div class="card p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold">Ảnh sản phẩm</div>
          <span class="muted" *ngIf="form.hasVariants && !isEdit()">Lưu bước 1 để tạo ID rồi up ảnh</span>
        </div>

        <!-- Ảnh đã gắn -->
        <div class="grid grid-cols-2 gap-3" *ngIf="productOnlyImages().length">
          <div class="img-card" *ngFor="let img of productOnlyImages(); let i = index">
            <img [src]="img.url" class="thumb mb-2" (error)="onImgErr($event)">
            <div class="text-xs text-slate-600 break-all">{{ img.publicId || '—' }}</div>
            <div class="flex items-center gap-2 mt-2">
              <button class="btn text-rose-600" (click)="deleteImage(img)">Xoá</button>
            </div>
          </div>
        </div>
        <div class="muted" *ngIf="!productOnlyImages().length && pendingProductPreviews.length===0">Chưa có ảnh.</div>

        <!-- Preview ảnh tạm (biến thể đơn, chưa có ID) -->
        <div class="grid grid-cols-2 gap-3" *ngIf="pendingProductPreviews.length">
          <div class="img-card" *ngFor="let src of pendingProductPreviews; let i = index">
            <img [src]="src" class="thumb mb-2" (error)="onImgErr($event)">
            <div class="text-xs text-slate-600">Ảnh chờ upload</div>
          </div>
        </div>

        <div class="mt-3">
          <input type="file" multiple (change)="onFiles($event)" [disabled]="form.hasVariants && !isEdit()" />
          <div class="muted mt-1" *ngIf="form.hasVariants">Chỉ gắn ảnh cấp sản phẩm, ảnh cấp biến thể gắn ở bước Biến thể.</div>
        </div>
      </div>
    </div>

    <div class="stickybar">
      <button class="btn" (click)="saveBasic(false)" [disabled]="saving()">Lưu</button>
      <button class="btn btn-primary" (click)="saveBasic(true)" [disabled]="saving()">
        {{ form.hasVariants ? 'Tiếp tục' : 'Lưu & thoát' }}
      </button>
    </div>
  </ng-container>

  <!-- STEP 2 -->
  <ng-container *ngIf="form.hasVariants && step()===2">
    <div class="card p-4">
      <div class="flex items-center justify-between mb-2">
        <div class="font-semibold">Thuộc tính mô tả / Lọc</div>
        <button class="btn" (click)="addAttrRow()">+ Thêm</button>
      </div>
      <div class="grid gap-2">
        <div class="grid md:grid-cols-2 gap-2" *ngFor="let a of attrs(); let i = index">
          <input class="inp" placeholder="Tên (VD: Brand)" [(ngModel)]="a.name">
          <div class="flex gap-2">
            <input class="inp flex-1" placeholder="Giá trị (VD: CeraVe)" [(ngModel)]="a.value">
            <button class="btn text-rose-600" (click)="removeAttr(i)">Xoá</button>
          </div>
        </div>
      </div>
    </div>

    <div class="stickybar">
      <button class="btn" (click)="prev()">‹ Quay lại</button>
      <button class="btn" (click)="saveAttributesOnly()">Lưu thuộc tính</button>
      <button class="btn btn-primary" (click)="saveAttributesNext()">Tiếp tục</button>
    </div>
  </ng-container>

  <!-- STEP 3 -->
  <ng-container *ngIf="form.hasVariants && step()===3">
    <div class="card p-4">
      <div class="font-semibold mb-2">Định nghĩa Options</div>
      <div class="grid md:grid-cols-3 gap-3">
        <div class="border rounded-lg p-2" *ngFor="let o of options; let oi = index">
          <div class="flex items-center gap-2 mb-2">
            <input class="inp" placeholder="Tên option (VD: Color/Size)" [(ngModel)]="o.name">
            <button class="btn text-rose-600" (click)="removeOption(oi)">Xoá</button>
          </div>
          <div class="flex flex-wrap gap-2">
            <span class="chip" *ngFor="let v of o.values; let vi = index">
              {{v}} <button (click)="removeOptionValue(oi, vi)">✕</button>
            </span>
          </div>
          <div class="mt-2 flex gap-2">
            <input class="inp flex-1" placeholder="Thêm giá trị…" [(ngModel)]="newOptVal[oi]">
            <button class="btn" (click)="addOptionValue(oi)">+ Thêm</button>
          </div>
        </div>
      </div>
      <div class="mt-2 flex gap-2">
        <button class="btn" (click)="addOption()">+ Thêm Option</button>
        <button class="btn btn-primary" (click)="generateCombos()">Tạo tổ hợp</button>
      </div>

      <div class="mt-4 font-semibold">Danh sách biến thể</div>
      <div class="overflow-auto">
        <table class="table-v">
          <thead>
            <tr>
              <th class="thv">Options</th>
              <th class="thv">SKU</th>
              <th class="thv">Giá</th>
              <th class="thv">KM</th>
              <th class="thv">Tồn hiện tại</th>
              <th class="thv">Trạng thái</th>
              <th class="thv w-64">Ảnh</th>
              <th class="thv"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of variants; let i = index">
              <td class="tdv"><div class="text-xs text-slate-600">{{ optionsToText(v.options) }}</div></td>
              <td class="tdv"><input class="inp-xs" [(ngModel)]="v.sku"></td>
              <td class="tdv"><input class="inp-xs" type="number" min="0" [(ngModel)]="v.price"></td>
              <td class="tdv"><input class="inp-xs" type="number" min="0" [(ngModel)]="v.salePrice"></td>
              <td class="tdv">
                <span *ngIf="v.id; else dash">{{ getVariantQty(v.id!) }}</span>
                <ng-template #dash>—</ng-template>
              </td>
              <td class="tdv"><input type="checkbox" [(ngModel)]="v.active"></td>
              <td class="tdv">
                <input type="file" multiple (change)="onFilesVariant($event, i)" [disabled]="!isEdit()">
                <div class="muted text-xs">* Lưu biến thể để có ID trước khi gắn ảnh</div>
                <div class="flex gap-1 mt-1" *ngIf="v?.id">
                  <img *ngFor="let img of variantImages(v?.id)" [src]="img.url" class="thumb-sm" (error)="onImgErr($event)">
                </div>
              </td>
              <td class="tdv"><button class="btn text-rose-600" (click)="removeVariant(i)">Xoá</button></td>
            </tr>
            <tr *ngIf="!variants.length">
              <td class="tdv text-slate-500 text-center" colspan="8">Chưa có biến thể.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 grid md:grid-cols-3 gap-2">
        <input class="inp" type="number" min="0" placeholder="Áp dụng Giá…" [(ngModel)]="bulk.price">
        <input class="inp" type="number" min="0" placeholder="Áp dụng KM…" [(ngModel)]="bulk.salePrice">
        <button class="btn" (click)="applyBulk()">Áp dụng toàn bộ</button>
      </div>
    </div>

    <div class="stickybar">
      <button class="btn" (click)="prev()">‹ Quay lại</button>
      <button class="btn btn-primary" (click)="saveVariants()">Lưu & thoát</button>
    </div>
  </ng-container>
</div>
  `
})
export class AdminProductWizardPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private products = inject(ProductService);
  private categories = inject(CategoryService);
  private uploadSvc = inject(UploadService);
  private toast = inject(ToastService);
  private inventory = inject(InventoryService);
  private overlay = inject(LoadingOverlayService);

  step = signal<1 | 2 | 3>(1);
  id: number | null = null;
  isEdit = signal(false);
  saving = signal(false);

  form: ProductRequest = {
    name: '', sku: '', price: 0, salePrice: null,
    shortDesc: '', description: '', categoryId: null as any,
    featured: false, active: true, hasVariants: false
  };

  catOptions = signal<Option[]>([]);
  images = signal<ProductImage[]>([]);
  attrs = signal<ProductAttribute[]>([]);

  options: { name: string; values: string[] }[] = [];
  newOptVal: Record<number, string> = {};
  variants: (ProductVariant & { id?: number })[] = [];
  bulk: { price?: number; salePrice?: number | null } = {};

  placeholder = 'assets/img/placeholder.png';
  currentStock = signal<number>(0);
  private variantQtyMap = signal<Record<number, number>>({});

  // Hàng đợi ảnh tạm (biến thể đơn)
  pendingProductFiles: File[] = [];
  pendingProductPreviews: string[] = [];

  basicValid = computed(() =>
    !!this.form.name?.trim() &&
    !!this.form.categoryId &&
    (!this.form.hasVariants ? (this.form.price != null && this.form.price >= 0) : true)
  );

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ? +this.route.snapshot.paramMap.get('id')! : null;
    this.isEdit.set(!!this.id);

    this.categories.listTree().subscribe({
      next: (tree: Category[]) => this.catOptions.set(this.makeCatOptions(tree)),
      error: () => this.catOptions.set([])
    });

    if (this.id) this.loadDetail(this.id);
  }

  ngOnDestroy(): void {
    this.pendingProductPreviews.forEach(u => URL.revokeObjectURL(u));
    this.overlay.close();
  }

  onHasVariantsToggle(v: boolean){
    this.form.hasVariants = !!v;
    this.step.set(this.form.hasVariants ? 2 : 1);
  }

  private loadDetail(id: number) {
    this.overlay.open('Đang tải chi tiết sản phẩm…');
    this.products.get(id).subscribe({
      next: (p: ProductResponse) => {
        this.form = {
          name: p.name, sku: p.sku ?? '', price: p.price ?? 0, salePrice: p.salePrice ?? null,
          shortDesc: p.shortDesc ?? '', description: p.description ?? '',
          categoryId: p.categoryId!, featured: !!p.featured, active: p.active !== false, hasVariants: !!p.hasVariants
        };
        this.images.set(p.images ?? []);
        this.attrs.set(p.attributes ?? []);
        this.variants = (p.variants ?? []).map(v => ({
          id: v.id, sku: v.sku, price: Number(v.price || 0), salePrice: v.salePrice ?? null,
          options: v.options || {}, active: v.active !== false
        }));

        this.inventory.productQty(id).subscribe({
          next: (res) => this.currentStock.set((res as any)?.data ?? (res as unknown as number)),
          error: () => this.currentStock.set(0)
        });

        this.loadVariantQtys();
        this.rebuildOptionsFromVariants();

        if (this.form.hasVariants) this.step.set(2);
        this.overlay.close();
      },
      error: () => { this.overlay.close(); this.toast.error('Không tải được sản phẩm'); }
    });
  }

  private loadVariantQtys() {
    const ids = this.variants.map(v => v.id).filter(Boolean) as number[];
    const map: Record<number, number> = { ...this.variantQtyMap() };
    ids.forEach(id => {
      this.inventory.variantQty(id).subscribe({
        next: (res) => { map[id] = (res as any)?.data ?? (res as unknown as number); this.variantQtyMap.set({ ...map }); },
        error: () => { map[id] = 0; this.variantQtyMap.set({ ...map }); }
      });
    });
  }

  getVariantQty(id: number) { return this.variantQtyMap()[id] ?? 0; }

  // ===== STEP 1
  saveBasic(next: boolean) {
    if (!this.basicValid()) { this.toast.error('Vui lòng nhập tên, danh mục và giá hợp lệ'); return; }
    this.saving.set(true);
    this.overlay.open('Đang lưu thông tin sản phẩm…');

    const usingVariants = !!this.form.hasVariants;

    const body: ProductRequest = {
      name: (this.form.name || '').trim(),
      sku: (this.form.sku || '')?.trim() || null,
      price: usingVariants ? 0 : Number(this.form.price || 0),
      salePrice: usingVariants ? null : (this.form.salePrice != null ? Number(this.form.salePrice) : null),
      shortDesc: this.form.shortDesc || '',
      description: this.form.description || '',
      categoryId: this.form.categoryId!,
      featured: !!this.form.featured,
      active: this.form.active !== false,
      hasVariants: usingVariants,
    };

    const finish = () => { this.saving.set(false); this.overlay.close(); };

    const afterSaved = () => {
      // Nếu là biến thể đơn và có ảnh tạm -> upload xong rồi mới điều hướng
      if (!this.form.hasVariants && this.pendingProductFiles.length > 0 && this.id) {
        this.overlay.openWithProgress('Đang tải ảnh sản phẩm…', 0);
        this.uploadPendingProductFilesThen(() => {
          finish();
          if (!next || !this.form.hasVariants) this.router.navigate(['/admin/products']);
          else this.step.set(2);
        });
        return;
      }

      finish();
      if (!next) { this.router.navigate(['/admin/products']); return; }
      if (!this.form.hasVariants) { this.router.navigate(['/admin/products']); return; }
      this.step.set(2);
    };

    const onErr = (e: any) => { finish(); this.toast.error(e?.error?.message || 'Lưu sản phẩm thất bại'); };

    if (this.id) {
      this.products.update(this.id, body).subscribe({
        next: () => { this.toast.success('Đã lưu thông tin sản phẩm'); afterSaved(); },
        error: onErr
      });
    } else {
      this.products.create(body).subscribe({
        next: (newId: number) => {
          this.toast.success('Đã tạo sản phẩm');
          this.id = newId; this.isEdit.set(true);
          afterSaved();
        },
        error: onErr
      });
    }
  }

  // Upload hàng đợi ảnh tạm (biến thể đơn)
  private uploadPendingProductFilesThen(done: () => void){
    if (!this.id) { done(); return; }

    let sortOrder = this.images().length
      ? Math.max(...this.images().map(m => m.sortOrder ?? 0)) + 1
      : 0;

    const files = [...this.pendingProductFiles];
    const previews = [...this.pendingProductPreviews];
    const total = files.length;
    const stepProgress = (i: number) => Math.round(((i) / total) * 100);

    const next = (i: number) => {
      if (i >= total) {
        // clear queue
        previews.forEach(u => URL.revokeObjectURL(u));
        this.pendingProductFiles = [];
        this.pendingProductPreviews = [];
        this.overlay.setProgress(100);
        done();
        return;
      }
      const f = files[i];
      this.overlay.setMessage(`Đang tải ảnh (${i+1}/${total})…`);
      this.overlay.setProgress(stepProgress(i));

      this.uploadSvc.upload(f, 'products').subscribe({
        next: (res: any) => {
          const data = res?.data || res;
          const url = data.secureUrl || data.url;
          const publicId = data.publicId;

          this.products.addImage(this.id!, {
            url, publicId, alt: f.name, sortOrder: sortOrder++
          }).subscribe({
            next: (imageId: number) => {
              this.images.set([...this.images(), {
                id: imageId, url, publicId, alt: f.name, sortOrder: sortOrder - 1
              }]);
              next(i + 1);
            },
            error: (e: any) => { this.toast.error(e?.error?.message || 'Gắn ảnh thất bại'); next(i + 1); }
          });
        },
        error: () => { this.toast.error('Upload thất bại'); next(i + 1); }
      });
    };
    next(0);
  }

  // ===== STEP 2
  addAttrRow() { this.attrs.set([...this.attrs(), { name: '', value: '' } as ProductAttribute]); }
  removeAttr(i: number) { this.attrs.set(this.attrs().filter((_, idx) => idx !== i)); }

  saveAttributesOnly() {
    if (!this.id) { this.toast.error('Hãy lưu bước 1 trước'); return; }
    this.overlay.open('Đang lưu thuộc tính…');
    const payload = this.attrs().map(a => ({
      id: a.id, name: (a.name || '').trim(), value: (a.value || '').trim()
    })).filter(a => a.name && a.value);

    this.products.upsertAttributes(this.id!, payload).subscribe({
      next: () => { this.overlay.close(); this.toast.success('Đã lưu thuộc tính'); },
      error: (e: any) => { this.overlay.close(); this.toast.error(e?.error?.message || 'Lưu thuộc tính thất bại'); }
    });
  }

  saveAttributesNext() { this.saveAttributesOnly(); this.step.set(3); }

  // ===== STEP 3 (variants)
  addOption() { if (this.options.length >= 3) return; this.options.push({ name: '', values: [] }); }
  removeOption(i: number) { this.options.splice(i, 1); }
  removeOptionValue(oi: number, vi: number) { this.options[oi]?.values?.splice(vi, 1); }
  addOptionValue(i: number) {
    const val = (this.newOptVal[i] || '').trim();
    if (!val) return;
    const o = this.options[i];
    if (!o.values.includes(val)) o.values.push(val);
    this.newOptVal[i] = '';
  }

  generateCombos() {
    const opts = this.options.filter(o => o.name && o.values.length);
    if (!opts.length) { this.toast.error('Chưa có option hợp lệ'); return; }
    const combos = opts.reduce((acc, o) => {
      const next: any[] = [];
      for (const base of (acc.length ? acc : [{}])) {
        for (const val of o.values) { next.push({ ...base, [o.name]: val }); }
      }
      return next;
    }, [] as any[]);
    const sig = (m: any) => JSON.stringify(m);
    const existing = new Map(this.variants.map(v => [sig((v as any).options || {}), v]));
    const out: any[] = [];
    for (const c of combos) {
      const ex = existing.get(sig(c));
      out.push(ex ? ex : { sku: '', price: 0, salePrice: null, options: c, active: true });
    }
    this.variants = out;
  }

  optionsToText(o: any) { return Object.entries(o || {}).map(([k, v]) => `${k}:${v}`).join(' • '); }
  removeVariant(i: number) { this.variants.splice(i, 1); }
  applyBulk() {
    for (const v of this.variants) {
      if (this.bulk.price != null) v.price = this.bulk.price;
      if (this.bulk.salePrice != null) v.salePrice = this.bulk.salePrice;
    }
  }
  private sanitizeSkuPart(s: string) {
    return (s || '').toString().trim().toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  private genSku(opts: Record<string, any>, idx: number) {
    const base = this.form.sku?.trim() || `P${this.id ?? 'NEW'}`;
    const parts = Object.entries(opts || {}).map(([_, v]) => this.sanitizeSkuPart(String(v)));
    const suffix = parts.length ? parts.join('-') : `VAR${idx + 1}`;
    return `${this.sanitizeSkuPart(base)}-${suffix}`;
  }

  saveVariants() {
    if (!this.id) { this.toast.error('Hãy lưu bước 1 trước'); return; }
    this.overlay.open('Đang lưu biến thể…');

    this.variants.forEach((v, i) => { if (!v.sku || !v.sku.trim()) v.sku = this.genSku((v as any).options || {}, i); });

    const payload = this.variants.map(v => ({
      id: v.id,
      sku: (v.sku || '').trim(),
      price: Number(v.price || 0),
      salePrice: v.salePrice != null ? Number(v.salePrice) : null,
      options: (v as any).options || {},
      active: v.active !== false
    })).filter(v => v.sku && v.price >= 0);

    if (!payload.length) { this.overlay.close(); this.toast.error('Chưa có biến thể hợp lệ'); return; }

    this.products.upsertVariants(this.id!, payload as any).subscribe({
      next: (vs) => {
        this.variants = (vs || []).map(v => ({
          id: (v as any).id, sku: v.sku, price: Number(v.price || 0),
          salePrice: (v as any).salePrice ?? null,
          options: (v as any).options || {}, active: (v as any).active !== false
        }));
        this.loadVariantQtys();
        this.overlay.close();
        this.toast.success('Đã lưu biến thể');
        this.router.navigate(['/admin/products']);
      },
      error: (e: any) => { this.overlay.close(); this.toast.error(e?.error?.message || 'Lưu biến thể thất bại'); }
    });
  }

  // ===== images (product-level)
  onFiles(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    // biến thể đơn + CHƯA có id -> preview tạm
    if (!this.form.hasVariants && !this.id) {
      for (const f of files) {
        this.pendingProductFiles.push(f);
        const url = URL.createObjectURL(f);
        this.pendingProductPreviews.push(url);
      }
      this.toast.info('Ảnh đã được thêm vào danh sách chờ. Bấm Lưu để tải lên.');
      input.value = '';
      return;
    }

    // còn lại bắt buộc có id
    if (!this.id) { this.toast.error('Hãy lưu bước 1 trước'); input.value = ''; return; }

    let sortOrder = this.images().length
      ? Math.max(...this.images().map(m => m.sortOrder ?? 0)) + 1
      : 0;

    const total = files.length;
    this.overlay.openWithProgress('Đang tải ảnh sản phẩm…', 0);
    const stepProgress = (i: number) => Math.round(((i) / total) * 100);

    const uploadNext = (idx: number) => {
      if (idx >= total) { this.overlay.setProgress(100); this.overlay.close(); return; }
      const f = files[idx];
      this.overlay.setMessage(`Đang tải ảnh (${idx+1}/${total})…`);
      this.overlay.setProgress(stepProgress(idx));

      this.uploadSvc.upload(f, 'products').subscribe({
        next: (res: any) => {
          const data = res?.data || res;
          const url = data.secureUrl || data.url;
          const publicId = data.publicId;

          this.products.addImage(this.id!, {
            url, publicId, alt: f.name, sortOrder: sortOrder++
          }).subscribe({
            next: (imageId: number) => {
              this.images.set([...this.images(), {
                id: imageId, url, publicId, alt: f.name, sortOrder: sortOrder - 1
              }]);
              uploadNext(idx + 1);
            },
            error: (e: any) => { this.toast.error(e?.error?.message || 'Gắn ảnh thất bại'); uploadNext(idx + 1); }
          });
        },
        error: () => { this.toast.error('Upload thất bại'); uploadNext(idx + 1); }
      });
    };
    uploadNext(0);
    input.value = '';
  }

  // ===== images (variant-level)
  onFilesVariant(ev: Event, idx: number) {
    if (!this.id) { this.toast.error('Hãy lưu bước 1 trước'); return; }
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    const variantId = (this.variants[idx] as any)?.id;
    if (!variantId) { this.toast.error('Cần lưu biến thể trước khi gắn ảnh'); input.value = ''; return; }

    let sortOrder = 0;
    const total = files.length;
    this.overlay.openWithProgress('Đang tải ảnh biến thể…', 0);
    const stepProgress = (i: number) => Math.round(((i) / total) * 100);

    const next = (i: number) => {
      if (i >= total) { this.overlay.setProgress(100); this.overlay.close(); return; }
      const f = files[i];
      this.overlay.setMessage(`Đang tải ảnh (${i+1}/${total})…`);
      this.overlay.setProgress(stepProgress(i));

      this.uploadSvc.upload(f, 'products').subscribe({
        next: (res: any) => {
          const data = res?.data || res;
          const url = data.secureUrl || data.url;
          const publicId = data.publicId;

          this.products.addImage(this.id!, {
            url, publicId, alt: f.name, sortOrder: sortOrder++, variantId
          }).subscribe({
            next: (imageId: number) => {
              this.images.set([...this.images(), {
                id: imageId, url, publicId, alt: f.name, sortOrder: sortOrder - 1, variantId
              } as any]);
              next(i + 1);
            },
            error: (e: any) => { this.toast.error(e?.error?.message || 'Gắn ảnh biến thể thất bại'); next(i + 1); }
          });
        },
        error: () => { this.toast.error('Upload thất bại'); next(i + 1); }
      });
    };
    next(0);
    input.value = '';
  }

  deleteImage(img: ProductImage) {
    if (!confirm('Xoá ảnh này?')) return;
    this.overlay.open('Đang xoá ảnh…');
    this.products.deleteImage(img.id).subscribe({
      next: () => { this.overlay.close(); this.images.set(this.images().filter(x => x.id !== img.id)); this.toast.success('Đã xoá ảnh'); },
      error: (e: any) => { this.overlay.close(); this.toast.error(e?.error?.message || 'Xoá ảnh thất bại'); }
    });
  }
  onImgErr(ev: Event) { (ev.target as HTMLImageElement).src = this.placeholder; }

  // helpers
  productOnlyImages(){ return this.images().filter((i: any) => !i.variantId); }
  variantImages(variantId?: number | null){ return this.images().filter((i: any) => i.variantId === variantId); }

  prev() { if (this.step() > 1) this.step.update(x => (x - 1) as any); }
  private makeCatOptions(tree: Category[], level = 0, acc: Option[] = []): Option[] {
    const pad = '—'.repeat(level);
    for (const n of tree) {
      const hasChildren = (n.children?.length ?? 0) > 0;
      acc.push({ id: n.id, label: `${pad} ${n.name}`.trim(), disabled: hasChildren });
      if (hasChildren) this.makeCatOptions(n.children!, level + 1, acc);
    }
    return acc;
  }
  private rebuildOptionsFromVariants() {
    const map = new Map<string, Set<string>>();
    for (const v of this.variants) {
      const opts = (v as any).options || {};
      Object.entries(opts).forEach(([k, val]) => {
        if (!map.has(k)) map.set(k, new Set<string>());
        const s = String(val ?? '').trim();
        if (s) map.get(k)!.add(s);
      });
    }
    this.options = Array.from(map.entries()).map(([name, set]) => ({ name, values: Array.from(set) }));
  }
}

/** giữ route cũ: AdminProductFormPageComponent */
export { AdminProductWizardPageComponent as AdminProductFormPageComponent };
