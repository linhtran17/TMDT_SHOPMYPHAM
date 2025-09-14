import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsService } from '../../core/services/news.service';
import { News } from '../../core/models/news.model';

@Component({
  standalone: true,
  selector: 'app-news-list',
  imports: [CommonModule, RouterLink],
  template: `
<section class="max-w-6xl mx-auto px-4 py-6">
  <h1 class="text-2xl font-extrabold mb-5">Tin tức</h1>

  <!-- Khi có dữ liệu -->
  <ng-container *ngIf="items().length; else empty">
    <!-- BÀI NỔI BẬT -->
    <a [routerLink]="['/news', hero()!.slug]"
       class="block rounded-2xl overflow-hidden bg-white border group mb-6">
      <div class="grid md:grid-cols-2">
        <div class="h-48 md:h-64 overflow-hidden">
          <img [src]="hero()!.coverImageUrl || placeholder"
               (error)="usePlaceholder($event)"
               class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"/>
        </div>
        <div class="p-4 md:p-6">
          <h2 class="text-xl md:text-2xl font-extrabold group-hover:text-rose-600 leading-tight">
            {{ hero()!.title }}
          </h2>
          <p class="text-xs text-slate-500 mt-1">
            {{ hero()!.publishedAt ? (hero()!.publishedAt | date:'short') : '' }}
          </p>
          <p class="text-slate-700 mt-2 line-clamp-3 md:line-clamp-4">
            {{ hero()!.excerpt }}
          </p>
          <span class="inline-flex items-center text-rose-600 text-sm mt-3">Đọc tiếp →</span>
        </div>
      </div>
    </a>

    <!-- DANH SÁCH NGANG -->
    <div class="rounded-2xl border bg-white divide-y">
      <a *ngFor="let n of rest()"
         [routerLink]="['/news', n.slug]"
         class="group flex gap-3 md:gap-4 items-start p-3 md:p-4 hover:bg-rose-50">
        <img [src]="n.coverImageUrl || placeholder"
             (error)="usePlaceholder($event)"
             class="w-28 h-20 md:w-40 md:h-28 rounded-lg object-cover flex-none"/>
        <div class="min-w-0">
          <h3 class="font-semibold text-base md:text-lg leading-snug line-clamp-2 group-hover:text-rose-600">
            {{ n.title }}
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ n.publishedAt ? (n.publishedAt | date:'shortDate') : '' }}
          </p>
          <p class="text-sm text-slate-600 mt-1 line-clamp-2 md:line-clamp-3">
            {{ n.excerpt }}
          </p>
        </div>
      </a>
    </div>
  </ng-container>

  <!-- RỖNG -->
  <ng-template #empty>
    <p class="text-slate-500">Chưa có bài viết</p>
  </ng-template>
</section>
  `
})
export class NewsListComponent implements OnInit {
  private api = inject(NewsService);

  items = signal<News[]>([]);
  placeholder = 'assets/img/placeholder.png';

  // hero + phần còn lại
  hero = computed(() => this.items()[0]);
  rest = computed(() => this.items().slice(1));

  ngOnInit(){
    this.api.listPublic(20).subscribe(res => this.items.set(res || []));
  }

  usePlaceholder(ev: Event){
    (ev.target as HTMLImageElement).src = this.placeholder;
  }
}
