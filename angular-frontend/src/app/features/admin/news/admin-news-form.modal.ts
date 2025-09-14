import {
  Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy,
  Output, SimpleChanges, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsService } from '../../../core/services/news.service';
import { UploadService } from '../../../core/services/upload.service';
import { News } from '../../../core/models/news.model';

@Component({
  standalone: true,
  selector: 'app-admin-news-form-modal',
  imports: [CommonModule, FormsModule],
  styles: [`
    /* ===== OVERLAY 2 LỚP ===== */
    .overlay{
      position: fixed; inset: 0; z-index: 9999;
      display: grid; place-items: center;
      padding: 12px;
      max-height: 100dvh;
    }
    .scrim{
      position: absolute; inset: 0;
      background: rgba(0,0,0,.30);
    }

    /* ===== MODAL PANEL ===== */
    .modal{
      position: relative; z-index: 1;
      width: min(860px, calc(100vw - 24px));
      max-height: min(88vh, calc(100dvh - 24px));
      background: #fff;
      border: 1px solid rgb(226 232 240);           /* slate-200 */
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(2,8,23,.20);
      display: grid;
      grid-template-rows: auto 1fr auto;
      overflow: hidden;
      opacity: 1 !important; filter: none !important; backdrop-filter: none !important;
    }

    .head{ padding: 12px 16px; border-bottom: 1px solid rgb(226 232 240); background:#fff; font-weight: 600; }
    .body{ padding: 16px; overflow: auto; background:#fff; }
    .foot{ padding: 12px 16px; border-top: 1px solid rgb(226 232 240); background:#fff; display:flex; justify-content:flex-end; gap:8px; }

    .row{ display:grid; grid-template-columns: 1fr; gap:12px; }
    @media (min-width: 768px){ .row{ grid-template-columns: 1fr 1fr; } }

    .label{ display:block; font-size:.875rem; font-weight:500; margin-bottom:4px; }
    .inp{
      width:100%; border:1px solid rgb(226 232 240); border-radius:10px; padding:8px 12px; font-size:.875rem; outline:none;
    }
    .inp:focus{ border-color: rgb(244 63 94); box-shadow: 0 0 0 3px rgba(244,63,94,.15); }

    textarea.inp{ min-height: 112px; resize: vertical; }

    .btn{
      display:inline-flex; align-items:center; gap:8px;
      border:1px solid rgb(226 232 240); border-radius:12px; padding:8px 12px; font-size:.875rem; background:#fff;
      transition: background .15s;
    }
    .btn:hover{ background: rgb(248 250 252); }
    .btn-primary{
      background: linear-gradient(90deg,#f43f5e,#db2777); color:#fff; border-color:#f43f5e; font-weight:600;
    }
    .btn-primary:hover{ filter:brightness(.98); }
    .btn[disabled]{ opacity:.6; pointer-events:none; }

    .img-preview{
      width:100%; max-height:180px; object-fit:cover;
      border:1px solid rgb(226 232 240); border-radius:10px;
    }

    .badge{
      background: rgb(241 245 249); color: rgb(71 85 105);
      border-radius: 6px; padding: 2px 6px; font-size: .75rem; margin-left: 6px;
    }
  `],
  template: `
<div *ngIf="open" class="overlay" role="dialog" aria-modal="true" aria-label="News form modal">
  <!-- nền mờ -->
  <div class="scrim" (click)="close()"></div>

  <!-- panel -->
  <div class="modal" (click)="$event.stopPropagation()">
    <div class="head">
      {{ form.id ? 'Sửa bài viết' : 'Tạo bài viết' }}
      <span class="badge" *ngIf="form.id">#{{ form.id }}</span>
    </div>

    <form class="body" (ngSubmit)="save()">
      <div class="row">
        <div>
          <label class="label">Tiêu đề</label>
          <input class="inp" [(ngModel)]="form.title" name="title" (input)="autoSlug()" required autofocus>
        </div>
        <div>
          <label class="label">Slug</label>
          <input class="inp" [(ngModel)]="form.slug" name="slug" required>
        </div>
      </div>

      <div class="row">
        <div>
          <label class="label">Ảnh cover</label>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <input type="file" (change)="pick($event)" accept="image/*">
            <button type="button" class="btn" (click)="upload()" [disabled]="!picked || uploading">
              {{ uploading ? 'Đang upload…' : 'Upload' }}
            </button>
          </div>
          <input class="inp" style="margin-top:8px" [(ngModel)]="form.coverImageUrl" name="coverImageUrl" placeholder="https://...">
          <img *ngIf="form.coverImageUrl" [src]="form.coverImageUrl" class="img-preview" style="margin-top:8px" (error)="usePlaceholder($event)">
        </div>

        <div>
          <label class="label">Ngày đăng</label>
          <input class="inp" type="datetime-local" [(ngModel)]="publishedLocal" name="publishedLocal" [max]="maxLocal">
          <label class="label" style="display:flex; align-items:center; gap:8px; margin-top:8px; font-weight:400;">
            <input type="checkbox" [(ngModel)]="form.active" name="active"> Active
          </label>
        </div>
      </div>

      <div>
        <label class="label">Tóm tắt</label>
        <textarea class="inp" rows="2" [(ngModel)]="form.excerpt" name="excerpt"></textarea>
      </div>

      <div>
        <label class="label">Nội dung (HTML)</label>
        <textarea class="inp" rows="8" [(ngModel)]="form.content" name="content" placeholder="<p>...</p>"></textarea>
      </div>

      <div style="color:#e11d48; font-size:.875rem; margin-top:4px;" *ngIf="error()">{{ error() }}</div>
      <div style="color:#059669; font-size:.875rem; margin-top:4px;" *ngIf="notice()">{{ notice() }}</div>
    </form>

    <div class="foot">
      <button type="button" class="btn" (click)="close()">Huỷ</button>
      <button type="button" class="btn btn-primary" (click)="save()" [disabled]="saving()">
        {{ saving() ? 'Đang lưu…' : (form.id ? 'Lưu thay đổi' : 'Tạo bài viết') }}
      </button>
    </div>
  </div>
</div>
  `
})
export class AdminNewsFormModalComponent implements OnChanges, OnDestroy {
  private api = inject(NewsService);
  private uploadSvc = inject(UploadService);

  @Input() open = false;
  @Input() item: News | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved  = new EventEmitter<void>();

  form: Partial<News> = { active: true };
  picked?: File;
  uploading = false;

  // datetime-local
  publishedLocal = this.nowLocal();
  maxLocal = '9999-12-31T23:59';

  saving = signal(false);
  error  = signal('');
  notice = signal('');
  placeholder = 'assets/img/placeholder.png';

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['item'] || ch['open']) {
      if (this.item) {
        this.form = { ...this.item };
        this.publishedLocal = this.item.publishedAt ? this.isoUtcToLocal(this.item.publishedAt) : this.nowLocal();
      } else if (!this.item) {
        this.form = { active: true };
        this.publishedLocal = this.nowLocal();
      }
      this.error.set(''); this.notice.set('');
      this.toggleBodyScroll(this.open);
    }
  }

  ngOnDestroy(): void { this.toggleBodyScroll(false); }

  @HostListener('document:keydown.escape')
  onEsc(){ if (this.open) this.close(); }

  close(){ this.toggleBodyScroll(false); this.closed.emit(); }

  pick(e: Event){
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.picked = f;
  }

  upload(){
    if (!this.picked || this.uploading) return;
    this.uploading = true; this.error.set(''); this.notice.set('');
    this.uploadSvc.upload(this.picked, 'news').subscribe({
      next: r => {
        this.form.coverImageUrl = r.data.secureUrl;
        this.uploading = false; this.picked = undefined;
        this.notice.set('Upload thành công');
      },
      error: () => { this.uploading=false; this.error.set('Upload thất bại'); }
    });
  }

  autoSlug(){
    const t = (this.form.title || '').trim().toLowerCase();
    if (!this.form.slug || !this.form.slug.length) {
      this.form.slug = t
        .normalize('NFD').replace(/\p{Diacritic}/gu,'')
        .replace(/[^a-z0-9\s-]/g,'')
        .replace(/\s+/g,'-').replace(/-+/g,'-')
        .replace(/^-+|-+$/g,'');
    }
  }

  save(){
    if (this.saving()) return;
    if (!this.form.title || !this.form.slug) { this.error.set('Thiếu tiêu đề/slug'); return; }

    this.saving.set(true); this.error.set(''); this.notice.set('');
    const payload: Partial<News> = {
      ...this.form,
      publishedAt: this.localToIsoUtc(this.publishedLocal)
    };

    const done = () => { this.saving.set(false); this.saved.emit(); };
    const fail = (e:any) => { this.saving.set(false); this.error.set(e?.error?.message || 'Lưu thất bại'); };

    if (this.form.id) this.api.update(this.form.id, payload).subscribe({ next: done, error: fail });
    else this.api.create(payload).subscribe({ next: done, error: fail });
  }

  usePlaceholder(ev: Event){ (ev.target as HTMLImageElement).src = this.placeholder; }

  // ===== helpers =====
  private toggleBodyScroll(lock: boolean){
    const b = document.body;
    if (!b) return;
    if (lock){ b.style.overflow = 'hidden'; }
    else { b.style.overflow = ''; }
  }
  private nowLocal(){
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
  }
  private localToIsoUtc(local: string){
    const d = new Date(local);
    return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString();
  }
  private isoUtcToLocal(iso: string){
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
  }
}
