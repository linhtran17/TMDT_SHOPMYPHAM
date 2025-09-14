import {
  Component, EventEmitter, HostListener, Input, OnChanges,
  Output, SimpleChanges, inject, signal, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CategoryService } from '../../../core/services/category.service';
import { UploadService } from '../../../core/services/upload.service';
import { Category, CategoryRequest } from '../../../core/models/category.model';
import { HttpEventType } from '@angular/common/http';

type Option = { id: number|null; label: string; disabled?: boolean };

@Component({
  selector: 'app-category-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .overlay{ @apply fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center; }
    .modal{ @apply w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden; }
    .head{ @apply px-5 py-4 flex items-center justify-between border-b; }
    .title{ @apply text-lg font-semibold; }
    .close{ @apply w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-slate-100; }
    .body{ @apply p-5 grid gap-4; }
    .row{ @apply grid md:grid-cols-2 gap-3; }
    .inp{ @apply w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200; }
    .btn{ @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50; }
    .btn-primary{ @apply bg-rose-600 text-white border-rose-600 hover:bg-rose-700; }
    .foot{ @apply px-5 py-4 flex items-center gap-2 border-t; }
    .badge{ @apply text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600; }

    /* Upload */
    .drop{ @apply rounded-xl border-2 border-dashed px-4 py-5 text-sm bg-slate-50/50 hover:bg-slate-50 transition-colors; }
    .drop.drag{ @apply border-rose-300 bg-rose-50/50; }
    .hint{ @apply text-xs text-slate-500; }
    .thumb{ @apply w-28 h-28 rounded-lg object-cover border; }
    .actions{ @apply flex items-center gap-2; }
    .progress{ @apply w-full h-2 bg-slate-100 rounded overflow-hidden; }
    .bar{ @apply h-2 bg-rose-600; }
  `],
  template: `
<div *ngIf="open" class="overlay" (click)="backdrop($event)">
  <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
    <div class="head">
      <div class="title">
        {{ id ? 'Cập nhật danh mục' : 'Tạo danh mục' }}
        <span class="badge" *ngIf="id">#{{ id }}</span>
      </div>
      <button class="close" (click)="close()">✕</button>
    </div>

    <form class="body" (ngSubmit)="submit()">
      <div>
        <label class="text-sm font-medium">Tên</label>
        <input class="inp" [(ngModel)]="form.name" name="name" required>
      </div>

      <div class="row">
        <div>
          <label class="text-sm font-medium">Slug</label>
          <input class="inp" [(ngModel)]="form.slug" name="slug" placeholder="để trống sẽ tự tạo">
        </div>
        <div>
          <label class="text-sm font-medium">Thứ tự</label>
          <input class="inp" type="number" [(ngModel)]="form.sortOrder" name="sortOrder">
        </div>
      </div>

      <!-- UPLOAD ẢNH DANH MỤC -->
      <div class="grid md:grid-cols-[1fr,auto] gap-3">
        <div>
          <label class="text-sm font-medium">Ảnh danh mục</label>

          <!-- Dropzone -->
          <div class="drop" [class.drag]="dragging"
               (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
            <div class="flex items-center gap-3">
              <img *ngIf="previewUrl() || form.imageUrl" class="thumb"
                   [src]="previewUrl() || form.imageUrl" alt="preview">
              <div class="grow">
                <div class="text-sm">
                  Kéo & thả ảnh vào đây, hoặc
                  <button class="btn ml-1" type="button" (click)="pickFile()">Chọn ảnh</button>
                </div>
                <div class="hint mt-1">Hỗ trợ JPG/PNG/WebP, tối đa {{maxSizeMB}}MB.</div>
                <div class="mt-2" *ngIf="uploading()">
                  <div class="progress"><div class="bar" [style.width.%]="progress()"></div></div>
                  <div class="hint mt-1">Đang tải lên… {{ progress() | number:'1.0-0' }}%</div>
                </div>
                <div class="actions mt-2" *ngIf="form.imageUrl || previewUrl()">
                  <button type="button" class="btn" (click)="clearImage()" [disabled]="uploading()">Xoá ảnh</button>
                </div>
              </div>
            </div>
            <input #fileInput type="file" class="hidden" accept="image/*" (change)="onFileChange($event)">
          </div>

          <!-- URL readonly để biết BE đã lưu đường dẫn nào -->
          <input class="inp mt-2" [readOnly]="true" [value]="form.imageUrl || ''" placeholder="URL sau khi upload" />
        </div>

        <div class="flex flex-col justify-end">
          <button class="btn" type="button" (click)="uploadNow()"
                  [disabled]="!selectedFile() || uploading()">
            ⬆ Tải ảnh lên
          </button>
        </div>
      </div>

      <div class="row">
        <div>
          <label class="text-sm font-medium">Danh mục cha</label>
          <select class="inp" [(ngModel)]="selectedParentId" name="parentId">
            <option [ngValue]="null">— Không có (gốc) —</option>
            <option *ngFor="let opt of parentOptions()" [ngValue]="opt.id" [disabled]="opt.disabled">
              {{ opt.label }}
            </option>
          </select>
          <label class="inline-flex items-center gap-2 mt-2 text-sm">
            <input type="checkbox" [(ngModel)]="clearParent" name="clearParent"> Bỏ liên kết cha
          </label>
        </div>

        <div class="flex items-end">
          <label class="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" [(ngModel)]="form.active" name="active"> Hiển thị
          </label>
        </div>
      </div>

      <div class="text-rose-600 text-sm" *ngIf="error()">{{ error() }}</div>
      <div class="text-emerald-600 text-sm" *ngIf="notice()">{{ notice() }}</div>

      <div class="foot">
        <button class="btn" type="button" (click)="close()">Huỷ</button>
        <button class="btn-primary" [disabled]="saving() || uploading()">
          {{ saving() ? 'Đang lưu…' : (id ? 'Cập nhật' : 'Tạo') }}
        </button>
      </div>
    </form>
  </div>
</div>
  `
})
export class CategoryFormModalComponent implements  OnChanges {
  private svc = inject(CategoryService);
  private up  = inject(UploadService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() open = false;         // nếu dùng như route component: cứ để mặc định true ở ngOnInit
  @Input() id: number|null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved  = new EventEmitter<void>();

  form: CategoryRequest = { name:'', slug:'', description:'', imageUrl:'', sortOrder:0, active:true, parentId:null, clearParent:false };
  selectedParentId: number|null = null;
  clearParent = false;

  tree = signal<Category[]>([]);
  parentOptions = signal<Option[]>([]);
  saving = signal(false);
  error  = signal('');
  notice = signal('');

  // Upload states
  maxSizeMB = 5;
  dragging = false;
  selectedFile = signal<File|null>(null);
  previewUrl   = signal<string|undefined>(undefined);
  uploading    = signal(false);
  progress     = signal(0);



  ngOnChanges(changes: SimpleChanges): void {
    // Khi open chuyển sang true => load dữ liệu
    if (changes['open'] && this.open) {
      this.loadTree();
      this.error.set(''); this.notice.set('');
      if (this.id) this.loadOne(this.id); else this.resetForm();
    }
    if (changes['id'] && this.open) {
      if (this.id) this.loadOne(this.id); else this.resetForm();
    }
  }

  private resetForm(){
    this.form = { name:'', slug:'', description:'', imageUrl:'', sortOrder:0, active:true, parentId:null, clearParent:false };
    this.selectedParentId = null;
    this.clearParent = false;
    this.clearSelectionOnly();
    this.rebuildOptions();
  }

  private loadTree(){
    this.svc.listTree().subscribe({
      next: t => { this.tree.set(t || []); this.rebuildOptions(); },
      error: () => { this.tree.set([]); this.rebuildOptions(); }
    });
  }

  private loadOne(id:number){
    this.svc.get(id).subscribe({
      next: (res:any) => {
        const c = res?.data ?? res;
        this.form = {
          name: c.name, slug: c.slug, description: c.description || '',
          imageUrl: c.imageUrl || '', sortOrder: c.sortOrder ?? 0,
          active: c.active ?? true, parentId: c.parentId ?? null, clearParent: false
        };
        this.selectedParentId = this.form.parentId ?? null;
        this.clearSelectionOnly();
        this.rebuildOptions();
      },
      error: () => { this.error.set('Không tải được danh mục'); }
    });
  }

  private rebuildOptions(){
    const make = (tree: Category[], level=0, acc:Option[]=[]): Option[] => {
      const pad = '—'.repeat(level);
      for (const n of tree) {
        acc.push({ id:n.id, label: `${pad} ${n.name}`.trim(), disabled: this.id!=null && n.id===this.id });
        if (n.children?.length) make(n.children, level+1, acc);
      }
      return acc;
    };
    this.parentOptions.set(make(this.tree()));
  }

  // ===== Upload handlers =====
  pickFile(){ this.fileInput?.nativeElement.click(); }

  onFileChange(e: Event){
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.error.set('File không phải ảnh'); return; }
    if (file.size > this.maxSizeMB*1024*1024) { this.error.set(`Ảnh vượt quá ${this.maxSizeMB}MB`); return; }

    this.error.set('');
    this.selectedFile.set(file);
    this.makePreview(file);
    // Auto upload ngay sau khi chọn
    this.uploadNow();
  }

  onDragOver(e: DragEvent){ e.preventDefault(); this.dragging = true; }
  onDragLeave(e: DragEvent){ e.preventDefault(); this.dragging = false; }
  onDrop(e: DragEvent){
    e.preventDefault(); this.dragging = false;
    const file = e.dataTransfer?.files?.[0] || null;
    if (!file) return;
    const fakeEvent = { target: { files: [file] } } as unknown as Event;
    this.onFileChange(fakeEvent);
  }

  private makePreview(file: File){
    const url = URL.createObjectURL(file);
    this.previewUrl.set(url);
  }
  private clearSelectionOnly(){
    if (this.previewUrl()) URL.revokeObjectURL(this.previewUrl()!);
    this.previewUrl.set(undefined);
    this.selectedFile.set(null);
    this.progress.set(0);
    this.uploading.set(false);
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  clearImage(){
    this.clearSelectionOnly();
    this.form.imageUrl = '';
  }

  uploadNow(){
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.progress.set(0);
    this.up.uploadWithProgress(file, 'categories').subscribe({
      next: (ev) => {
        if (ev.type === HttpEventType.UploadProgress && ev.total) {
          this.progress.set(Math.round(100 * (ev.loaded / ev.total)));
        } else if (ev.type === HttpEventType.Response) {
          const res = ev.body;
          const url = res?.data?.secureUrl || res?.data?.url;
          if (!url) throw new Error('Upload không trả về URL');
          this.form.imageUrl = url;
          this.notice.set('Đã tải ảnh lên');
          this.clearSelectionOnly(); // giữ preview bằng imageUrl đã có
        }
      },
      error: (e) => {
        this.uploading.set(false);
        this.error.set(e?.error?.message || 'Upload thất bại');
      },
      complete: () => {
        this.uploading.set(false);
      }
    });
  }

  // ===== Submit =====
  submit(){
    this.saving.set(true); this.error.set(''); this.notice.set('');
    const body: CategoryRequest = {
      ...this.form,
      parentId: this.clearParent ? null : this.selectedParentId,
      clearParent: this.clearParent,
    };

    const onOk = () => { this.saving.set(false); this.notice.set('Đã lưu'); this.saved.emit(); this.close(); };
    const onErr = (e:any) => { this.saving.set(false); this.error.set(e?.error?.message || 'Lỗi lưu danh mục'); };

    if (this.id) this.svc.update(this.id, body).subscribe({ next: onOk, error: onErr });
    else this.svc.create(body).subscribe({ next: onOk, error: onErr });
  }

  backdrop(_: MouseEvent){ this.close(); }
  close(){ this.closed.emit(); }

  @HostListener('document:keydown.escape') onEsc(){ if (this.open) this.close(); }
}
