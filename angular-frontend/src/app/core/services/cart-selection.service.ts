import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CartSelectionService {
  private key = 'cart:selected'; // chỉ lưu id để tránh lệ thuộc dữ liệu

  save(ids: number[]) {
    localStorage.setItem(this.key, JSON.stringify({ ids, at: Date.now() }));
    window.dispatchEvent(new Event('cart:selection'));
  }
  load(): number[] {
    try {
      const raw = localStorage.getItem(this.key);
      const obj = raw ? JSON.parse(raw) : null;
      return Array.isArray(obj?.ids) ? obj.ids as number[] : [];
    } catch { return []; }
  }
  clear() { localStorage.removeItem(this.key); window.dispatchEvent(new Event('cart:selection')); }
}
