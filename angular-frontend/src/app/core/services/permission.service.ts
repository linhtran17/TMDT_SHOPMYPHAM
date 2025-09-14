// src/app/core/services/permission.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private _set = signal<Set<string>>(new Set());
  set(list: string[]){ this._set.set(new Set(list)); }
  clear(){ this._set.set(new Set()); }
  has(p: string){ return this._set().has(p); }
  any(ps: string[]){ return ps.some(p => this.has(p)); }
  all(ps: string[]){ return ps.every(p => this.has(p)); }
}
