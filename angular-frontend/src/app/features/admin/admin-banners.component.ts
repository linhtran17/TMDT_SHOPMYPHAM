import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BannerService } from '../../core/services/banner.service';
import { UploadService } from '../../core/services/upload.service';
import { Banner } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-admin-banners',
  imports: [CommonModule, FormsModule],
  template: `
<div class="max-w-3xl mx-auto">
  <h2 class="text-xl font-extrabold mb-4">Quản lý Banner</h2>

  <!-- Create -->
  <form class="card p-4 mb-6 grid gap-3" (ngSubmit)="create()">
    <div class="grid sm:grid-cols-2 gap-3">
      <div>
        <label class="label">Tiêu đề</label>
        <input class="inp w-full" [(ngModel)]="form.title" name="title" placeholder="Sale 9.9">
      </div>
      <div>
        <label class="label">Link khi click</label>
        <input class="inp w-full" [(ngModel)]="form.link" name="link" placeholder="/products?cat=skincare">
      </div>
    </div>

    <div class="grid sm:grid-cols-2 gap-3">
      <div>
        <label class="label">Ảnh</label>
        <div class="flex items-center gap-2">
          <input type="file" (change)="pick($event)" accept="image/*">
          <button type="button" class="btn" (click)="upload()" [disabled]="!picked || uploading">
            {{ uploading ? 'Đang upload…' : 'Upload' }}
          </button>
        </div>

        <input class="inp mt-2 w-full" [(ngModel)]="form.imageUrl" name="imageUrl" placeholder="https://... (hoặc upload)">
        <div class="mt-2 text-xs text-slate-500" *ngIf="form.publicId">
          publicId: <code>{{ form.publicId }}</code>
        </div>

        <div class="mt-3" *ngIf="form.imageUrl">
          <img [src]="form.imageUrl" alt="preview" class="h-24 w-48 object-cover rounded-md border">
        </div>
      </div>

      <div>
        <label class="label">Thứ tự</label>
        <input class="inp w-28" type="number" [(ngModel)]="form.sortOrder" name="sortOrder" min="0">
        <label class="inline-flex items-center gap-2 mt-2">
          <input type="checkbox" [(ngModel)]="form.active" name="active"> Active
        </label>
      </div>
    </div>

    <div class="flex gap-2 items-center">
      <button class="btn-primary px-4 py-2 rounded-lg disabled:opacity-60" [disabled]="creating">
        {{ creating ? 'Đang tạo…' : 'Tạo banner' }}
      </button>
      <span class="text-rose-600 text-sm" *ngIf="error">{{ error }}</span>
      <span class="text-emerald-600 text-sm" *ngIf="notice">{{ notice }}</span>
    </div>
  </form>

  <!-- List -->
  <div class="card overflow-hidden">
    <table class="min-w-full text-sm">
      <thead class="bg-slate-50 text-slate-600">
        <tr>
          <th class="p-3 text-left">Ảnh</th>
          <th class="p-3 text-left">Tiêu đề</th>
          <th class="p-3">Sort</th>
          <th class="p-3">Active</th>
          <th class="p-3 w-28"></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let b of items(); trackBy: trackById" class="border-t">
          <td class="p-3">
            <img [src]="b.imageUrl" alt="" class="h-12 w-24 object-cover rounded-md border">
          </td>
          <td class="p-3">{{ b.title }}</td>
          <td class="p-3">
            <input type="number" class="inp w-20" [ngModel]="b.sortOrder"
                   (ngModelChange)="update(b, { sortOrder: $event })">
          </td>
          <td class="p-3 text-center">
            <input type="checkbox" [ngModel]="b.active"
                   (ngModelChange)="update(b, { active: $event })">
          </td>
          <td class="p-3 text-right">
 <button class="icon-btn icon-btn-rose" (click)="remove(b)" title="Xoá" aria-label="Xoá">
                    <img class="icon" src="assets/icon/binn.png" alt="Xoá" />
                </button>          </td>
        </tr>
        <tr *ngIf="!loading() && !items().length">
          <td colspan="5" class="p-6 text-center text-slate-500">Chưa có banner</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
  `,
  styles: [`
    .card{ @apply rounded-2xl border border-slate-200 bg-white shadow-sm; }
    .inp{ @apply rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border border-rose-600 hover:bg-rose-700; }
    .label{ @apply text-sm font-medium; }
  `]
})
export class AdminBannersComponent implements OnInit {
  private banner = inject(BannerService);
  private uploadSvc = inject(UploadService);

  items = signal<Banner[]>([]);
  loading = signal(true);
  creating = false;
  uploading = false;
  error = '';
  notice = '';

  form: Partial<Banner> = { active: true, sortOrder: 1 };
  picked?: File;

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading.set(true);
    this.banner.listAdmin().subscribe({
      next: items => { this.items.set(items || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  pick(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) { this.picked = f; this.notice = ''; this.error = ''; }
  }

  upload() {
    if (!this.picked || this.uploading) return;
    this.uploading = true; this.error = ''; this.notice = '';
    this.uploadSvc.upload(this.picked, 'banners').subscribe({
      next: res => {
        const r = res.data;
        this.form.imageUrl = r.secureUrl;
        this.form.publicId = r.publicId || '';
        this.picked = undefined;
        this.notice = 'Upload thành công';
        this.uploading = false;
      },
      error: err => {
        this.error = err?.error?.message || 'Upload thất bại';
        this.uploading = false;
      }
    });
  }

  create() {
    if (!this.form.imageUrl) { this.error = 'Cần ảnh banner'; return; }
    this.creating = true; this.error = ''; this.notice = '';
    this.banner.create({
      title: this.form.title || '',
      imageUrl: this.form.imageUrl!,
      publicId: this.form.publicId || '',
      link: this.form.link || '',
      sortOrder: this.form.sortOrder ?? 1,
      active: !!this.form.active
    }).subscribe({
      next: () => {
        this.creating = false;
        this.form = { active: true, sortOrder: 1 };
        this.refresh();
        this.notice = 'Đã tạo banner';
      },
      error: err => {
        this.creating = false;
        this.error = err?.error?.message || 'Tạo thất bại';
      }
    });
  }

  update(b: Banner, patch: Partial<Banner>) {
    this.banner.update(b.id, patch).subscribe({ next: () => this.refresh() });
  }

  remove(b: Banner) {
    if (!confirm('Xoá banner này?')) return;
    this.banner.remove(b.id).subscribe({ next: () => this.refresh() });
  }

  trackById = (_: number, b: Banner) => b.id;
}
