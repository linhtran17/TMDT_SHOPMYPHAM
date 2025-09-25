import { Component, Injectable, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type OverlayState = {
  open: boolean;
  message?: string;
  determinate: boolean;
  progress: number; // 0..100
};

@Injectable({ providedIn: 'root' })
export class LoadingOverlayService {
  private _state = signal<OverlayState>({
    open: false,
    message: 'Đang xử lý…',
    determinate: false,
    progress: 0,
  });

  state = this._state.asReadonly();
  isOpen = computed(() => this._state().open);

  open(message = 'Đang xử lý…') {
    this._state.set({ open: true, message, determinate: false, progress: 0 });
  }

  /**
   * Mở overlay với kiểu có progress (xác định)
   * @param message Chuỗi hiển thị
   * @param progress Giá trị 0..100
   */
  openWithProgress(message = 'Đang tải…', progress = 0) {
    this._state.set({ open: true, message, determinate: true, progress: Math.max(0, Math.min(100, progress)) });
  }

  setProgress(progress: number) {
    const s = this._state();
    if (!s.open) return;
    this._state.set({ ...s, determinate: true, progress: Math.max(0, Math.min(100, progress)) });
  }

  setMessage(message: string) {
    const s = this._state();
    if (!s.open) return;
    this._state.set({ ...s, message });
  }

  close() {
    this._state.set({ open: false, message: '', determinate: false, progress: 0 });
  }
}

@Component({
  standalone: true,
  selector: 'app-loading-overlay',
  imports: [CommonModule],
  styles: [`
    .backdrop{ @apply fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm; }
    .panel{ @apply fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] bg-white rounded-2xl shadow-xl border p-5 w-[min(92vw,380px)]; }
    .title{ @apply text-sm font-medium text-slate-700; }
    .row{ @apply mt-3 flex items-center gap-3; }
    .spinner{ @apply animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-rose-600 rounded-full; }
    .bar-wrap{ @apply w-full bg-slate-100 rounded-full h-2 overflow-hidden; }
    .bar{ @apply bg-rose-600 h-2; transition: width .25s ease; }
  `],
  template: `
    <ng-container *ngIf="svc.isOpen()">
      <div class="backdrop"></div>
      <div class="panel">
        <div class="title">{{ svc.state().message || 'Đang xử lý…' }}</div>

        <div class="row" *ngIf="!svc.state().determinate; else determinateTpl">
          <span class="spinner" aria-hidden="true"></span>
          <span class="text-sm text-slate-500">Vui lòng chờ trong giây lát…</span>
        </div>

        <ng-template #determinateTpl>
          <div class="row">
            <div class="bar-wrap" aria-label="Tiến độ">
              <div class="bar" [style.width.%]="svc.state().progress"></div>
            </div>
            <div class="text-sm text-slate-600 w-12 text-right">{{ svc.state().progress | number:'1.0-0' }}%</div>
          </div>
        </ng-template>
      </div>
    </ng-container>
  `
})
export class LoadingOverlayComponent {
  constructor(public svc: LoadingOverlayService){}
}
