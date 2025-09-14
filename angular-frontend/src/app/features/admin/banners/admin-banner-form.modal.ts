import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BannerService } from '../../../core/services/banner.service';
import { UploadService } from '../../../core/services/upload.service';
import { Banner } from '../../../core/models';

@Component({
  standalone: true,
  selector: 'app-admin-banner-form-modal',
  imports: [CommonModule, FormsModule],
  styles: [`
    /* Overlay chỉ làm mờ nền, KHÔNG ảnh hưởng panel */
    .backdrop{ @apply fixed inset-0 bg-black/25 z-[90]; }
    .modal{ @apply fixed inset-0 z-[100] flex items-center justify-center p-4; }

    /* Panel rõ nét */
    .panel{
      @apply w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden;
      opacity: 1; backdrop-filter: none;
    }
    .head{ @apply px-5 py-3 border-b flex items-center justify-between; }
    .body{ @apply p-5 grid gap-4 max-h-[70vh] overflow-auto; }
    .foot{ @apply px-5 py-3 border-t flex items-center justify-between gap-2; }

    .label{ @apply text-sm font-medium; }
    .inp{ @apply w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .grid2{ @apply grid sm:grid-cols-2 gap-4; }

    .btn{ @apply inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white hover:bg-slate-50 transition; }
    .btn-ghost{ @apply rounded-xl border-none bg-transparent hover:bg-slate-100; }
    .btn-cta{
      @apply rounded-xl text-white px-4 py-2 font-semibold shadow-sm
             bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700
             focus:outline-none focus:ring-2 focus:ring-rose-200;
    }
    /* đổi sang đỏ solid */
    .btn-danger{
      @apply rounded-xl px-3 py-2 font-medium text-white bg-rose-600 hover:bg-rose-700
             focus:outline-none focus:ring-2 focus:ring-rose-200;
    }
    .btn[disabled]{ @apply opacity-60 pointer-events-none; }

    .file-hidden{ display:none; }
    .preview{ @apply h-24 w-48 object-cover rounded-md border mt-2; }
    .x{ @apply w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100; }
  `],
  template: `
<div *ngIf="open" class="modal" (keydown.escape)="close()">
  <div class="backdrop" (click)="close()"></div>

  <div class="panel" role="dialog" aria-modal="true">
    <!-- Header -->
    <div class="head">
      <div class="text-base font-semibold">{{ form.id ? 'Sửa banner' : 'Tạo banner' }}</div>
      <button class="x" (click)="close()" aria-label="Đóng">
        <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 6l12 12M6 18L18 6"/>
        </svg>
      </button>
    </div>

    <!-- Body -->
    <div class="body">
      <div class="grid2">
        <div>
          <label class="label">Tiêu đề</label>
          <input class="inp" [(ngModel)]="form.title" name="title" placeholder="Sale 9.9" autofocus>
        </div>
        <div>
          <label class="label">Link khi click</label>
          <input class="inp" [(ngModel)]="form.link" name="link" placeholder="/products?cat=skincare">
        </div>
      </div>

      <div class="grid2">
        <div>
          <label class="label">Ảnh banner</label>
          <div class="flex flex-wrap items-center gap-2">
            <input id="bannerFile" type="file" class="file-hidden" (change)="pick($event)" accept="image/*">
            <label for="bannerFile" class="btn" role="button">Chọn ảnh</label>
            <button type="button" class="btn" (click)="upload()" [disabled]="!picked || uploading">
              {{ uploading ? 'Đang upload…' : 'Upload' }}
            </button>
          </div>
          <input class="inp mt-2" [(ngModel)]="form.imageUrl" name="imageUrl" placeholder="https://... (hoặc upload)">
          <div class="text-xs text-slate-500 mt-1" *ngIf="form.publicId">publicId: <code>{{form.publicId}}</code></div>
          <img *ngIf="form.imageUrl" [src]="form.imageUrl" class="preview" (error)="usePlaceholder($event)">
        </div>

        <div>
          <label class="label">Thứ tự</label>
          <input class="inp w-28" type="number" [(ngModel)]="form.sortOrder" name="sortOrder" min="0">
          <label class="inline-flex items-center gap-2 mt-2">
            <input type="checkbox" [(ngModel)]="form.active" name="active"> Active
          </label>
        </div>
      </div>

      <div class="text-rose-600 text-sm" *ngIf="error()">{{ error() }}</div>
      <div class="text-emerald-600 text-sm" *ngIf="notice()">{{ notice() }}</div>
    </div>

    <!-- Footer -->
    <div class="foot">
      <button *ngIf="form.id" class="btn-danger" (click)="confirmDelete()">Xoá</button>
      <div class="ml-auto flex items-center gap-2">
        <button class="btn btn-ghost" (click)="close()">Huỷ</button>
        <button class="btn-cta" (click)="save()" [disabled]="saving()">
          {{ saving() ? 'Đang lưu…' : (form.id ? 'Lưu thay đổi' : 'Tạo banner') }}
        </button>
      </div>
    </div>
  </div>
</div>
  `
})
export class AdminBannerFormModalComponent implements OnChanges {
  private api = inject(BannerService);
  private uploadSvc = inject(UploadService);

  @Input() open = false;
  @Input() item: Banner | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved  = new EventEmitter<void>();

  form: Partial<Banner> = { active: true, sortOrder: 1 };
  picked?: File;
  uploading = false;

  saving = signal(false);
  error  = signal('');
  notice = signal('');
  placeholder = 'assets/img/placeholder.png';

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['item']) {
      this.form = this.item ? { ...this.item } : { active: true, sortOrder: 1 };
      this.error.set(''); this.notice.set('');
      this.picked = undefined;
    }
  }

  close(){ this.closed.emit(); }

  pick(e: Event){
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.picked = f;
  }

  upload(){
    if (!this.picked || this.uploading) return;
    this.uploading = true; this.error.set(''); this.notice.set('');
    this.uploadSvc.upload(this.picked, 'banners').subscribe({
      next: res => {
        const r = res.data;
        this.form.imageUrl = r.secureUrl;
        this.form.publicId = r.publicId || '';
        this.picked = undefined;
        this.uploading = false;
        this.notice.set('Upload thành công');
      },
      error: err => {
        this.uploading = false;
        this.error.set(err?.error?.message || 'Upload thất bại');
      }
    });
  }

  save(){
    if (this.saving()) return;
    if (!this.form.imageUrl) { this.error.set('Cần ảnh banner'); return; }

    this.saving.set(true); this.error.set(''); this.notice.set('');
    const done = () => { this.saving.set(false); this.saved.emit(); };
    const fail = (e:any) => { this.saving.set(false); this.error.set(e?.error?.message || 'Lưu thất bại'); };

    if (this.form.id) this.api.update(this.form.id, this.form).subscribe({ next: done, error: fail });
    else this.api.create({
      title: this.form.title || '',
      imageUrl: this.form.imageUrl!,
      publicId: this.form.publicId || '',
      link: this.form.link || '',
      sortOrder: this.form.sortOrder ?? 1,
      active: !!this.form.active
    }).subscribe({ next: done, error: fail });
  }

  confirmDelete(){
    if (!this.form.id) return;
    if (!confirm('Xoá banner này?')) return;
    this.saving.set(true);
    this.api.remove(this.form.id).subscribe({
      next: () => { this.saving.set(false); this.saved.emit(); },
      error: (e) => { this.saving.set(false); this.error.set(e?.error?.message || 'Xoá thất bại'); }
    });
  }

  usePlaceholder(ev: Event){ (ev.target as HTMLImageElement).src = this.placeholder; }
}
