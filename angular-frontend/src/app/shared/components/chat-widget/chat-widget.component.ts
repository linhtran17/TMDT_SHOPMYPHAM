import { Component, effect, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatService, ChatAskResponse } from '../../../core/services/chat.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  text?: string;
  answerMd?: string;
  products?: ChatAskResponse['products'];
  ts: number;
};

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  encapsulation: ViewEncapsulation.Emulated,
  imports: [CommonModule, FormsModule, RouterLink, SafeHtmlPipe],
  template: `
  <!-- FAB (không nền, chỉ icon) -->
  <button class="fab" (click)="toggle()" [attr.aria-expanded]="open()" aria-label="Mở trợ lý">
    <img *ngIf="!open()" [src]="robotIcon" alt="Chatbot" class="ico" />
    <span *ngIf="open()" class="xmark">✕</span>
    <b class="badge" *ngIf="!open() && unread()">{{ unread() }}</b>
  </button>

  <!-- PANEL -->
  <section class="wrap" [class.open]="open()">
    <header class="head">
      <div class="brand">
        <img [src]="robotIcon" alt="" class="brand-ico" />
        <div class="tt">
          <strong>Tư vấn cùng ShopMyPham</strong>
          <small>Trả lời nhanh • Miễn phí</small>
        </div>
      </div>
      <button class="x" (click)="toggle()" aria-label="Đóng">✕</button>
    </header>

    <div class="body c-scroll">
      <div class="msg a">
        <div class="bbl a">
          Xin chào 👋 Mình là trợ lý tư vấn.
          Hãy nói điều bạn cần, ví dụ:
          <em>“Toner cấp ẩm cho da khô tầm 300–500k”</em> hoặc <em>“gợi ý sản phẩm”</em>.
        </div>
      </div>

      <ng-container *ngFor="let m of messages()">
        <div class="msg" [class.u]="m.role==='user'" [class.a]="m.role==='assistant'">
          <!-- Bubble trước -->
          <div class="bbl" *ngIf="m.text">{{ m.text }}</div>
          <div class="bbl rich" *ngIf="m.answerMd" [innerHTML]="m.answerMd | safeHtml"></div>

          <!-- Sản phẩm phía DƯỚI -->
          <div class="plist" *ngIf="m.products?.length">
            <div class="plist__title">Gợi ý phù hợp</div>

            <div class="plist__grid">
              <a class="item" *ngFor="let p of m.products" [routerLink]="['/products', p.id]">
                <div class="thumb" [class.noimg]="!p.image">
                  <img *ngIf="p.image" [src]="p.image" [alt]="p.name" />
                  <span *ngIf="!p.image">No image</span>
                </div>
                <div class="meta">
                  <div class="name" [title]="p.name">{{ p.name }}</div>
                  <div class="price">
                    <span class="sale" *ngIf="p.salePrice">{{ p.salePrice | number }}₫</span>
                    <span class="base" [class.strike]="p.salePrice">{{ p.price | number }}₫</span>
                  </div>
                  <div class="stk" [class.in]="p.inStock" [class.out]="!p.inStock">
                    {{ p.inStock ? 'Còn hàng' : 'Hết hàng' }}
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- typing -->
      <div class="msg a" *ngIf="loading()">
        <div class="bbl">
          <span class="dots"><i></i><i></i><i></i></span>
        </div>
      </div>
    </div>

    <footer class="foot">
      <form (ngSubmit)="send()" class="form">
        <input [(ngModel)]="input" name="input" required autocomplete="off" placeholder="Nhập câu hỏi của bạn..." />
        <button class="send" [disabled]="loading() || !input.trim()">Gửi</button>
      </form>
      <div class="chips">
        <button type="button" class="chip" (click)="quick('gợi ý sản phẩm')">Gợi ý sản phẩm</button>
        <button type="button" class="chip" (click)="quick('Toner cấp ẩm cho da khô tầm 300–500k')">Toner 300–500k</button>
        <button type="button" class="chip" (click)="quick('serum sáng da dưới 400k')">Serum &lt;400k</button>
      </div>
    </footer>
  </section>
  `,
  styles: [`
  :host{
    position: fixed; right: 18px; bottom: 18px; z-index: 99999;

    --pink-50:#fff0f6; --pink-100:#ffe0ef; --pink-200:#ffc2df; --pink-300:#ff99c7;
    --pink-400:#ff70ae; --pink-500:#ff4d97; --pink-600:#e63a84; --pink-700:#c7296f;
    --pink-800:#a21f59; --pink-900:#7a1742;

    --bg:#fff; --text:#2b2b2b; --muted:#777;
    --shadow:0 14px 40px rgba(255,77,151,.22);
    --r:18px;
  }

  /* FAB không nền */
  .fab{
    position: fixed; right: 18px; bottom: 18px;
    border: none; background: transparent; padding: 10px;
    cursor: pointer; border-radius: 14px; outline: none;
    transition: transform .12s ease;
  }
  .fab:focus-visible{ box-shadow: 0 0 0 3px rgba(255,77,151,.18); }
  .ico{
    width: 64px; height: 64px; object-fit: contain; display: block;
    image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;
    filter: saturate(1.15) contrast(1.05) drop-shadow(0 1px 0 rgba(0,0,0,.08));
    transition: transform .12s ease;
  }
  .fab:hover .ico{ transform: scale(1.08); }
  .xmark{ font-size: 26px; font-weight: 700; color: var(--pink-600); }
  .badge{
    position:absolute; right:-2px; top:-2px; min-width:20px; height:20px; padding:0 6px;
    background:#fff; color:var(--pink-700); border-radius:999px; font:600 11px/20px system-ui;
    box-shadow: 0 4px 12px rgba(0,0,0,.15); border:1px solid var(--pink-200);
  }

  /* Panel */
  .wrap{
    position: fixed; right: 18px; bottom: 92px;
    width: 380px; max-width: calc(100vw - 36px); height: 560px;
    display:none; flex-direction:column; overflow:hidden;
    background: rgba(255,255,255,.94);
    border: 1px solid var(--pink-100); border-radius: var(--r);
    box-shadow: var(--shadow); backdrop-filter: saturate(120%) blur(8px);
  }
  .wrap.open{ display:flex; animation: s .18s ease; }
  @keyframes s{ from{ opacity:0; transform: translateY(8px) scale(.98);} to{opacity:1; transform:none;} }

  .head{
    height:66px; display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding: 0 12px 0 16px;
    background: linear-gradient(90deg, var(--pink-500), var(--pink-400)); color:#fff;
  }
  .brand{ display:flex; align-items:center; gap:10px; }
  .brand-ico{ width:22px; height:22px; object-fit:contain; filter: drop-shadow(0 1px 0 rgba(0,0,0,.1)); }
  .tt strong{ display:block; font-weight:700; margin-top:-2px; }
  .tt small{ opacity:.9; }
  .x{ width:36px; height:36px; border-radius:12px; border:none; cursor:pointer; color: var(--pink-900); background:#fff; font-size:16px; }

  .body{ flex:1; overflow:auto; padding:14px; background: linear-gradient(180deg, var(--pink-50), #fff); }
  .c-scroll::-webkit-scrollbar{ width:10px; height:10px; }
  .c-scroll::-webkit-scrollbar-thumb{ background: var(--pink-200); border-radius:999px; }
  .c-scroll::-webkit-scrollbar-thumb:hover{ background: var(--pink-300); }

  /* ====== Chat message ====== */
  .msg{
    display:flex;
    flex-direction: column;   /* << GIỮA bubble và products THEO CỘT */
    align-items: flex-start;
    gap: 8px;                 /* khoảng cách bubble <-> danh sách */
    margin: 10px 0;
  }
  .msg.u{ align-items: flex-end; }  /* user tin nhắn dồn phải */

  .bbl{
    position:relative; max-width:88%; /* chặn chữ quá dài */
    padding:12px 14px; border-radius:16px;
    line-height:1.5; font-size:14px; box-shadow: 0 2px 10px rgba(0,0,0,.06);
  }
  .msg.u .bbl{ background: var(--pink-500); color:#fff; border-bottom-right-radius:6px; }
  .msg.a .bbl{ background:#fff; color:var(--text); border:1px solid var(--pink-100); border-bottom-left-radius:6px; }
  .msg.u .bbl::after, .msg.a .bbl::after{
    content:""; position:absolute; bottom:-6px; width:10px; height:10px; background:inherit; border:inherit; transform: rotate(45deg);
  }
  .msg.u .bbl::after{ right:8px; border-left:none; border-top:none; }
  .msg.a .bbl::after{ left:8px; border-right:none; border-top:none; }

  .rich :is(h1,h2,h3){ margin:.25rem 0 .2rem; font-size:16px; }
  .rich p{ margin:.35rem 0; }
  .rich ul{ margin:.35rem 0 .35rem 1.1rem; }
  .bbl em{ color: var(--pink-700); font-style: normal; font-weight: 600; }

  /* ===== Products list (luôn 1 cột, nằm dưới bubble) ===== */
  .plist{ margin:2px 0 0; width: 100%; }
  .plist__title{
    font:700 12px/1 system-ui; color: var(--pink-700);
    margin: 0 0 6px; text-transform: uppercase; letter-spacing:.3px;
  }
  .plist__grid{ display:grid; gap:8px; grid-template-columns: 1fr; } /* 1 cột cố định */

  .item{
    display:flex; gap:10px; padding:8px; border:1px solid var(--pink-100);
    border-radius:12px; text-decoration:none; color:inherit; background:#fff;
    transition: transform .12s ease, box-shadow .15s ease;
  }
  .item:hover{ transform: translateY(-1px); box-shadow: var(--shadow); }

  .thumb{
    width:76px; height:76px; flex:0 0 76px; border-radius:10px; overflow:hidden;
    background: var(--pink-50); display:flex; align-items:center; justify-content:center;
  }
  .thumb img{ max-width:100%; max-height:100%; object-fit:contain; }
  .thumb.noimg{ color:#999; font-size:12px; }

  .meta{ min-width:0; display:flex; flex-direction:column; gap:4px; }
  .name{
    font-weight:700; font-size:12.5px; line-height:1.3; color:#333;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
  }
  .price{ display:flex; gap:6px; align-items:center; }
  .price .sale{ color: var(--pink-700); font-weight:800; font-size:13px; }
  .price .base{ color:#666; font-weight:700; font-size:12px; }
  .price .base.strike{ text-decoration: line-through; opacity:.6; }
  .stk{ font-weight:700; font-size:11.5px; }
  .stk.in{ color:#0a8f3e; } .stk.out{ color:#a21f59; }

  /* Footer */
  .foot{ border-top:1px solid var(--pink-100); padding:8px; background:#fff; }
  .form{ display:flex; gap:8px; }
  .form input{
    flex:1; border-radius:12px; border:1px solid var(--pink-200); padding:12px 12px; outline:none; font-size:14px;
  }
  .form input:focus{ border-color: var(--pink-400); box-shadow: 0 0 0 3px rgba(255,77,151,.12); }
  .send{ background: var(--pink-500); color:#fff; border:none; border-radius:12px; padding:0 16px; font-weight:700; cursor:pointer; }
  .send:disabled{ opacity:.5; cursor:not-allowed; }

  .chips{ margin-top:8px; display:flex; gap:6px; flex-wrap:wrap; }
  .chip{ border:none; background: var(--pink-100); color: var(--pink-800);
         padding: 7px 12px; border-radius:999px; cursor:pointer; font:600 12px system-ui; }
  .chip:hover{ background: var(--pink-200); }
  `]
})
export class ChatWidgetComponent {
  private api = inject(ChatService);

  robotIcon = 'assets/icon/bot.png';

  open  = signal(false);
  loading = signal(false);
  messages = signal<ChatMessage[]>(this.restore());
  input = '';
  unread = signal(0);

  constructor() {
    effect(() => {
      this.persist(this.messages());
      const unseen = this.messages().filter(m => m.role==='assistant').length;
      if (!this.open()) this.unread.set(unseen);
      setTimeout(() => {
        const el = document.querySelector('.body') as HTMLElement | null;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }

  toggle(){ this.open.update(v => !v); if (this.open()) this.unread.set(0); }
  quick(text: string){ this.input = text; this.send(); }

  send(){
    const content = this.input.trim();
    if (!content || this.loading()) return;

    this.messages.update(list => [...list, { role:'user', text: content, ts: Date.now() }]);
    this.input = '';
    this.loading.set(true);

    this.api.ask({ message: content }).subscribe({
      next: (res) => {
        this.messages.update(list => [
          ...list,
          { role:'assistant', answerMd: res.answerMd, products: res.products, ts: Date.now() }
        ]);
        if (!this.open()) this.unread.update(n => n + 1);
        this.loading.set(false);
      },
      error: () => {
        this.messages.update(list => [
          ...list,
          { role:'assistant', text:'Ôi, có lỗi mạng rồi 😥, bạn thử lại giúp mình nhé!', ts: Date.now() }
        ]);
        if (!this.open()) this.unread.update(n => n + 1);
        this.loading.set(false);
      }
    });
  }

  private persist(d: ChatMessage[]){ try{ localStorage.setItem('chat_widget_history', JSON.stringify(d.slice(-30))); }catch{} }
  private restore(): ChatMessage[] { try{ return JSON.parse(localStorage.getItem('chat_widget_history')||'[]'); } catch{ return []; } }
}
