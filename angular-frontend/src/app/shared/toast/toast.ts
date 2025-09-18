// src/app/shared/toast/toast.ts
import { Component, Injectable, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';
export interface ToastItem { id: number; kind: ToastKind; message: string; timeout?: number; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _list = signal<ToastItem[]>([]);
  list = this._list.asReadonly(); // Signal<ToastItem[]>
  private seq = 1;

  private push(kind: ToastKind, message: string, timeout = 2500){
    const id = this.seq++;
    this._list.update(arr => [...arr, { id, kind, message, timeout }]);
    if (timeout && timeout > 0) setTimeout(() => this.dismiss(id), timeout);
  }
  dismiss(id: number){ this._list.update(arr => arr.filter(i => i.id !== id)); }

  success(msg: string, t?: number){ this.push('success', msg, t); }
  error(msg: string, t?: number){ this.push('error', msg, t); }
  info(msg: string, t?: number){ this.push('info', msg, t); }
  warning(msg: string, t?: number){ this.push('warning', msg, t); }
}

@Component({
  standalone: true,
  selector: 'app-toast-container',
  imports: [CommonModule],
  styles: [`
    .wrap{ @apply fixed z-[9999] right-4 top-4 grid gap-2; }
    .toast{ @apply min-w-[260px] max-w-[420px] rounded-xl border p-3 shadow bg-white flex items-start gap-2; }
    .s{ @apply border-emerald-200; } .e{ @apply border-rose-200; }
    .i{ @apply border-sky-200; }     .w{ @apply border-amber-200; }
    .dot{ @apply w-2 h-2 rounded-full mt-1; }
    .ds{ @apply bg-emerald-500; } .de{ @apply bg-rose-500; }
    .di{ @apply bg-sky-500; }    .dw{ @apply bg-amber-500; }
    .msg{ @apply text-sm; }
    .btn{ @apply ml-auto text-slate-400 hover:text-slate-600; }
  `],
  template: `
  <div class="wrap">
    <div *ngFor="let t of toast.list()" class="toast" [ngClass]="cls(t.kind)">
      <div class="dot" [ngClass]="dot(t.kind)"></div>
      <div class="msg">{{ t.message }}</div>
      <button class="btn" (click)="toast.dismiss(t.id)">✕</button>
    </div>
  </div>
  `
})
export class ToastContainerComponent {
  constructor(public toast: ToastService){} // public để template dùng trực tiếp

  cls(k: ToastKind){ return { s: k==='success', e: k==='error', i: k==='info', w: k==='warning' }; }
  dot(k: ToastKind){ return { ds: k==='success', de: k==='error', di: k==='info', dw: k==='warning' }; }
}
