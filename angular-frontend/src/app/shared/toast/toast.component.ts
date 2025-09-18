import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMsg } from './toast.service';

@Component({
  standalone: true,
  selector: 'app-toast',
  imports: [CommonModule],
  styles: [`
    .wrap{ position: fixed; right: 16px; bottom: 16px; z-index: 9999; display: grid; gap: 8px; }
    .item{ @apply px-4 py-2 rounded-xl shadow-lg border text-sm bg-white; min-width: 260px; }
    .ok{ @apply border-emerald-300 text-emerald-800 bg-emerald-50; }
    .err{ @apply border-rose-300 text-rose-800 bg-rose-50; }
    .inf{ @apply border-slate-300 text-slate-800 bg-slate-50; }
  `],
  template: `
  <div class="wrap">
    <div *ngFor="let t of list()" class="item" [ngClass]="{
      'ok': t.type==='success', 'err': t.type==='error', 'inf': t.type==='info'
    }">
      {{ t.text }}
    </div>
  </div>
  `
})
export class ToastComponent implements OnInit, OnDestroy {
  list = signal<ToastMsg[]>([]);
  private sub?: any;

  constructor(private toast: ToastService){}

  ngOnInit(){
    this.sub = this.toast.stream$.subscribe(msg => {
      this.list.update(arr => [...arr, msg]);
      const ms = msg.timeout ?? 2500;
      setTimeout(() => this.dismiss(msg.id), ms);
    });
  }
  ngOnDestroy(){ this.sub?.unsubscribe?.(); }
  private dismiss(id:number){ this.list.update(arr => arr.filter(x => x.id!==id)); }
}
