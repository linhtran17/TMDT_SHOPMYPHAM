import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success'|'error'|'info';
export interface ToastMsg { id: number; type: ToastType; text: string; timeout?: number; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 1;
  stream$ = new Subject<ToastMsg>();

  private push(type: ToastType, text: string, timeout = 2500){
    this.stream$.next({ id: this.seq++, type, text, timeout });
  }
  success(t: string, ms?: number){ this.push('success', t, ms); }
  error(t: string, ms?: number){ this.push('error', t, ms); }
  info(t: string, ms?: number){ this.push('info', t, ms); }
}
