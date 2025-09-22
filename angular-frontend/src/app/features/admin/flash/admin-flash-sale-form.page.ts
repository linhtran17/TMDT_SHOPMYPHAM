import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FlashSaleService } from '../../../core/services/flash-sale.service';
import { FlashSaleDto, FlashDealItem, FlashSaleUpsert } from '../../../core/models/flash-sale.model';

// BE trả 'YYYY-MM-DDTHH:mm[:ss[.SSS]]' -> cắt 'YYYY-MM-DDTHH:mm' để bind <input type="datetime-local">
function toLocalDatetimeValue(iso?: string){
  if(!iso) return '';
  return iso.length >= 16 ? iso.slice(0, 16) : iso;
}

@Component({
  standalone: true,
  selector: 'app-admin-flash-sale-form',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  styles: [`
    .page{ padding:1rem; }
    .tabs{ display:flex; gap:.5rem; margin-bottom:1rem; }
    .tab{ padding:.5rem .75rem; border-radius:.5rem; border:1px solid #e5e7eb; background:#fff; }
    .tab.active{ background:#fee2e2; border-color:#fecaca; }
    .form-grid{ display:grid; grid-template-columns: 1fr 1fr; gap:1rem; }
    .field{ display:flex; flex-direction:column; gap:.25rem; }
    .row{ display:flex; gap:.5rem; align-items:center; }
    .table{ width:100%; border-collapse:collapse; background:#fff; margin-top:1rem; }
    .table th,.table td{ padding:.625rem .75rem; border-bottom:1px solid #e5e7eb; text-align:left; }
    .actions{ display:flex; gap:.5rem; }
  `],
  template: `
  <div class="page">
    <div class="row" style="margin-bottom:1rem">
      <a routerLink="/admin/flash-sales" class="border rounded px-3 h-10 inline-flex items-center">← Danh sách</a>
      <div style="flex:1"></div>
      <button type="button" class="border rounded px-3 h-10" (click)="save()">
        {{ isEdit() ? 'Lưu thay đổi' : 'Tạo mới' }}
      </button>
    </div>

    <div class="tabs">
      <button class="tab" [class.active]="tab()==='info'" (click)="tab.set('info')">Thông tin</button>
      <button class="tab" [class.active]="tab()==='items'" (click)="tab.set('items')" [disabled]="!id()">Sản phẩm</button>
    </div>

    <!-- TAB 1: INFO -->
    <div *ngIf="tab()==='info'">
      <form class="form-grid" [formGroup]="fm" (ngSubmit)="save()">
        <div class="field">
          <label>Tên</label>
          <input class="border rounded h-10 px-3" formControlName="name" />
        </div>

        <div class="field">
          <label>Slug</label>
          <input class="border rounded h-10 px-3" formControlName="slug" />
        </div>

        <div class="field">
          <label>Kiểu giảm</label>
          <select class="border rounded h-10 px-3" formControlName="discountType">
            <option value="percentage">Phần trăm (%)</option>
            <option value="fixed">Số tiền (đ)</option>
          </select>
        </div>

        <div class="field">
          <label>Giá trị giảm</label>
          <input type="number" class="border rounded h-10 px-3" formControlName="discountValue" />
        </div>

        <div class="field">
          <label>Bắt đầu</label>
          <input type="datetime-local" class="border rounded h-10 px-3" formControlName="startAt" />
        </div>

        <div class="field">
          <label>Kết thúc</label>
          <input type="datetime-local" class="border rounded h-10 px-3" formControlName="endAt" />
        </div>

        <div class="field">
          <label>Ưu tiên</label>
          <input type="number" class="border rounded h-10 px-3" formControlName="priority" />
        </div>

        <div class="field row" style="align-items:center; margin-top:1.6rem">
          <input id="active" type="checkbox" formControlName="active" />
          <label for="active">Kích hoạt</label>
        </div>
      </form>
    </div>

    <!-- TAB 2: ITEMS -->
    <div *ngIf="tab()==='items'">
      <div class="row" style="margin-bottom:.5rem">
        <input type="number" class="border rounded h-10 px-3" placeholder="Product ID"
               [(ngModel)]="add.productId" name="add_productId">
        <input type="number" class="border rounded h-10 px-3" placeholder="Deal price (đ)"
               [(ngModel)]="add.dealPrice" name="add_dealPrice">
        <input type="number" class="border rounded h-10 px-3" placeholder="Sort"
               [(ngModel)]="add.sortOrder" name="add_sortOrder">
        <button class="border rounded px-3 h-10" type="button" (click)="addItem()">Thêm</button>
        <div style="flex:1"></div>
        <button class="border rounded px-3 h-10" type="button" (click)="reloadItems()">Tải lại</button>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th style="width:44px">#</th>
            <th>SP</th>
            <th>Tên</th>
            <th>SKU</th>
            <th>Giá gốc</th>
            <th>Giá cuối</th>
            <th>Deal price</th>
            <th>Sort</th>
            <th style="width:160px"></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let it of items(); let i = index">
            <td>{{ i+1 }}</td>
            <td>#{{ it.productId }}</td>
            <td>{{ it.name }}</td>
            <td>{{ it.sku }}</td>
            <td>{{ it.basePrice | number:'1.0-0' }}</td>
            <td>{{ it.finalPrice | number:'1.0-0' }}</td>
            <td>
              <input type="number" class="border rounded h-9 px-2 w-28"
                     [ngModel]="it.dealPrice"
                     (ngModelChange)="updateItem(it, {dealPrice: $event})">
            </td>
            <td>
              <input type="number" class="border rounded h-9 px-2 w-20"
                     [ngModel]="it.sortOrder"
                     (ngModelChange)="updateItem(it, {sortOrder: $event})">
            </td>
            <td class="actions">
              <button class="border rounded px-2 h-9" type="button" (click)="removeItem(it)">Xoá</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `
})
export default class AdminFlashSaleFormPageComponent {


  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(FlashSaleService);
  private fb = inject(FormBuilder);

  id = signal<number | null>(null);
  isEdit = signal(false);
  tab = signal<'info'|'items'>('info');

  // ✅ đúng API: nonNullable (chữ N viết hoa)
  fm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    discountType: <'percentage'|'fixed'>'percentage',
    discountValue: 0,
    startAt: '',
    endAt: '',
    priority: 0,
    active: true
  });

  detail = signal<FlashSaleDto | null>(null);
  items = signal<FlashDealItem[]>([]);
  add: { productId: number | null; dealPrice: number | null; sortOrder: number | null } = {
    productId: null, dealPrice: null, sortOrder: null
  };

  constructor(){
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(pm => {
      const idStr = pm.get('id');
      if (idStr) {
        this.isEdit.set(true);
        this.id.set(+idStr);
        this.loadDetail(+idStr);
      } else {
        this.isEdit.set(false);
        this.id.set(null);
      }
    });
  }

  loadDetail(id: number){
    this.api.adminGet(id).subscribe(d => {
      this.detail.set(d);
      this.fm.patchValue({
        name: d.name,
        slug: d.slug,
        discountType: (d.discountType || 'percentage') as any,
        discountValue: d.discountValue || 0,
        startAt: toLocalDatetimeValue(d.startAt),
        endAt: toLocalDatetimeValue(d.endAt),
        priority: d.priority,
        active: d.active
      });
      this.items.set(d.items || []);
      this.tab.set('info');
      setTimeout(() => this.tab.set('items'), 0);
    });
  }

  buildPayload(): FlashSaleUpsert {
    const v = this.fm.getRawValue();
    return {
      name: v.name.trim(),
      slug: v.slug.trim(),
      discountType: v.discountType,
      discountValue: +v.discountValue || 0,
      // gửi nguyên local 'YYYY-MM-DDTHH:mm'
      startAt: v.startAt || '',
      endAt: v.endAt || '',
      priority: +v.priority || 0,
      active: !!v.active
    };
  }

  save(){
    const body = this.buildPayload();
    if (this.isEdit() && this.id()) {
      this.api.adminUpdate(this.id()!, body).subscribe(() => {
        alert('Đã lưu');
        this.loadDetail(this.id()!);
      });
    } else {
      this.api.adminCreate(body).subscribe(id => {
        alert('Tạo thành công');
        this.router.navigate(['/admin/flash-sales', id, 'edit']);
      });
    }
  }

  addItem(){
    if (!this.id()) return;
    if (!this.add.productId) { alert('Nhập productId'); return; }
    this.api.adminAddItem(this.id()!, {
      productId: this.add.productId!,
      dealPrice: this.add.dealPrice ?? null,
      sortOrder: this.add.sortOrder ?? null
    }).subscribe(() => {
      this.add = { productId: null, dealPrice: null, sortOrder: null };
      this.reloadItems();
    });
  }

  updateItem(it: FlashDealItem, patch: Partial<Pick<FlashDealItem,'dealPrice'|'sortOrder'>>){
    if (!this.id() || !it.id) return;
    this.api.adminUpdateItem(this.id()!, it.id, {
      dealPrice: patch.dealPrice ?? it.dealPrice ?? null,
      sortOrder: patch.sortOrder ?? it.sortOrder ?? null
    }).subscribe(() => this.reloadItems());
  }

  removeItem(it: FlashDealItem){
    if (!this.id() || !it.id) return;
    if (!confirm(`Xoá SP #${it.productId} khỏi flash sale?`)) return;
    this.api.adminRemoveItem(this.id()!, it.id).subscribe(() => this.reloadItems());
  }

  reloadItems(){
    if (!this.id()) return;
    this.api.adminListItems(this.id()!).subscribe(list => this.items.set(list));
  }
}
