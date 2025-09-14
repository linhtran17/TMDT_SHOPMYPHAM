import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { UploadService } from '../../../core/services/upload.service';

import { ProductRequest, ProductResponse, ProductImage } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';

type Option = { id: number|null; label: string; disabled?: boolean };

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .wrap{ @apply max-w-5xl mx-auto; }
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700; }
    .inp{ @apply w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .grid-2{ @apply grid md:grid-cols-2 gap-4; }
    .thumb{ @apply w-28 h-28 rounded-xl object-cover border; }
    .img-card{ @apply p-3 rounded-xl border bg-white shadow-sm; }
    .muted{ @apply text-sm text-slate-500; }
    .danger{ @apply text-rose-600; }
  `],
  template: `
<div class="wrap p-4 md:p-6">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-2xl font-extrabold">{{ isEdit() ? 'Sửa sản phẩm' : 'Thêm sản phẩm' }}</h1>
    <div class="flex items-center gap-2">
      <button class="btn" (click)="back()">← Quay lại</button>
      <button class="btn btn-primary" [disabled]="saving()" (click)="submit()">
        {{ saving() ? 'Đang lưu…' : (isEdit() ? 'Cập nhật' : 'Tạo mới') }}
      </button>
    </div>
  </div>

  <div class="grid md:grid-cols-3 gap-5">
    <!-- FORM LEFT -->
    <div class="md:col-span-2 card p-4 grid gap-3">
      <div class="grid-2">
        <div>
          <label class="text-sm font-medium">Tên</label>
          <input class="inp" [(ngModel)]="form.name" name="name" required>
        </div>
        <div>
          <label class="text-sm font-medium">SKU</label>
          <input class="inp" [(ngModel)]="form.sku" name="sku" placeholder="có thể bỏ trống">
        </div>
      </div>

      <div class="grid-2">
        <div>
          <label class="text-sm font-medium">Giá</label>
          <input class="inp" type="number" min="0" [(ngModel)]="form.price" name="price" required>
        </div>
        <div>
          <label class="text-sm font-medium">Tồn kho</label>
          <input class="inp" type="number" min="0" [(ngModel)]="form.stock" name="stock">
        </div>
      </div>

      <div>
        <label class="text-sm font-medium">Danh mục</label>
        <select class="inp" [(ngModel)]="form.categoryId" name="categoryId" required>
          <option [ngValue]="null">— Chọn danh mục —</option>
          <option *ngFor="let opt of catOptions()" [ngValue]="opt.id" [disabled]="opt.disabled">
            {{ opt.label }}
          </option>
        </select>
        <div class="muted mt-1">Chỉ chọn <b>Danh mục lá</b>. Các danh mục cha bị disable.</div>
      </div>

      <div>
        <label class="text-sm font-medium">Mô tả</label>
        <textarea class="inp" rows="4" [(ngModel)]="form.description" name="description"></textarea>
      </div>

      <div class="text-rose-600 text-sm" *ngIf="error()">{{ error() }}</div>
      <div class="text-emerald-600 text-sm" *ngIf="notice()">{{ notice() }}</div>
    </div>

    <!-- IMAGES -->
    <div class="card p-4">
      <div class="flex items-center justify-between mb-2">
        <div class="font-semibold">Ảnh sản phẩm</div>
        <span class="muted" *ngIf="!isEdit()">Lưu sản phẩm trước để tải ảnh</span>
      </div>

      <div class="grid grid-cols-2 gap-3" *ngIf="images().length">
        <div class="img-card" *ngFor="let img of images(); let i = index">
          <img [src]="img.url" class="thumb mb-2">
          <div class="text-xs text-slate-600 break-all">{{ img.publicId || '—' }}</div>
          <div class="flex items-center gap-2 mt-2">
            <button class="btn danger" (click)="deleteImage(img)">Xoá</button>
          </div>
        </div>
      </div>
      <div class="muted" *ngIf="!images().length">Chưa có ảnh.</div>

      <div class="mt-3" *ngIf="isEdit()">
        <input type="file" multiple (change)="onFiles($event)" />
        <div class="muted mt-1">Chọn nhiều ảnh, hệ thống sẽ upload → gắn vào sản phẩm.</div>
      </div>
    </div>
  </div>
</div>
  `
})
export class AdminProductFormPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private products = inject(ProductService);
  private categories = inject(CategoryService);
  private uploadSvc = inject(UploadService);

  id: number | null = null;
  isEdit = signal(false);

  form: ProductRequest = { name: '', sku: '', price: 0, stock: 0, description: '', categoryId: null as any };
  catOptions = signal<Option[]>([]);

  images = signal<ProductImage[]>([]);
  saving = signal(false);
  error = signal('');
  notice = signal('');

  ngOnInit(){
    this.id = this.route.snapshot.paramMap.get('id') ? +this.route.snapshot.paramMap.get('id')! : null;
    this.isEdit.set(!!this.id);

    // build category options (disable non-leaf)
    this.categories.listTree().subscribe({
      next: (tree: Category[]) => this.catOptions.set(this.makeCatOptions(tree)),
      error: () => this.catOptions.set([])
    });

    if (this.id) {
      this.products.get(this.id).subscribe({
        next: (p: ProductResponse) => {
          this.form = {
            name: p.name,
            sku: p.sku ?? '',
            price: Number(p.price),
            stock: p.stock ?? 0,
            description: p.description ?? '',
            categoryId: p.categoryId!,
          };
          this.images.set(p.images ?? []);
        },
        error: () => { this.toastErr('Không tải được sản phẩm'); this.back(); }
      });
    }
  }

  submit(){
    this.saving.set(true); this.error.set(''); this.notice.set('');
    const body: ProductRequest = {
      name: (this.form.name || '').trim(),
      sku: (this.form.sku || '')?.trim() || null,
      price: Number(this.form.price || 0),
      stock: Number(this.form.stock || 0),
      description: this.form.description || '',
      categoryId: this.form.categoryId!,
    };

    const onOkCreate = (newId:number) => {
      this.saving.set(false); this.notice.set('Đã tạo sản phẩm');
      // sau khi tạo xong, chuyển sang trang edit để có thể upload ảnh
      this.router.navigate(['/admin/products', newId, 'edit']);
    };
    const onOkUpdate = () => {
      this.saving.set(false); this.notice.set('Đã cập nhật');
    };
    const onErr = (e:any) => {
      this.saving.set(false);
      // BE có các message: SKU đã tồn tại / Danh mục không hợp lệ / Chỉ gán vào danh mục lá...
      this.error.set(e?.error?.message || 'Lưu sản phẩm thất bại');
    };

    if (this.id) this.products.update(this.id, body).subscribe({ next: onOkUpdate, error: onErr });
    else this.products.create(body).subscribe({ next: onOkCreate, error: onErr });
  }

  // Images
  onFiles(ev: Event){
    if (!this.id) return; // cần ID để gắn
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    // upload tuần tự cho đơn giản
    let sortOrder = (this.images().length ? Math.max(...this.images().map(m => m.sortOrder ?? 0)) + 1 : 0);

    const uploadNext = (idx: number) => {
      if (idx >= files.length) return;
      const f = files[idx];

      this.uploadSvc.upload(f, 'products').subscribe({
        next: (res) => {
          const data = res?.data || res; // {url, publicId,...}
          this.products.addImage(this.id!, {
            url: data.secureUrl || data.url,
            publicId: data.publicId,
            alt: f.name,
            sortOrder: sortOrder++
          }).subscribe({
            next: (imageId:number) => {
              // refresh list ảnh (nhanh nhất là push local)
              this.images.set([
                ...this.images(),
                { id: imageId, url: data.secureUrl || data.url, publicId: data.publicId, alt: f.name, sortOrder: sortOrder-1 }
              ]);
              uploadNext(idx+1);
            },
            error: (e:any) => { this.toastErr(e?.error?.message || 'Gắn ảnh thất bại'); uploadNext(idx+1); }
          });
        },
        error: () => { this.toastErr('Upload thất bại'); uploadNext(idx+1); }
      });
    };

    uploadNext(0);
    // clear input
    input.value = '';
  }

  deleteImage(img: ProductImage){
    if (!confirm('Xoá ảnh này?')) return;
    this.products.deleteImage(img.id).subscribe({
      next: () => this.images.set(this.images().filter(x => x.id !== img.id)),
      error: (e:any) => this.toastErr(e?.error?.message || 'Xoá ảnh thất bại')
    });
  }

  back(){ this.router.navigate(['/admin/products']); }

  private toastErr(m:string){ this.error.set(m); }

  private makeCatOptions(tree: Category[], level=0, acc:Option[]=[]): Option[] {
    const pad = '—'.repeat(level);
    for (const n of tree) {
      const hasChildren = (n.children?.length ?? 0) > 0;
      acc.push({ id:n.id, label:`${pad} ${n.name}`.trim(), disabled: hasChildren });
      if (hasChildren) this.makeCatOptions(n.children!, level+1, acc);
    }
    return acc;
  }
}
