import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NewsService } from '../../core/services/news.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { News } from '../../core/models/news.model';

@Component({
  standalone: true,
  selector: 'app-news-detail',
  imports: [CommonModule],
  template: `
<section class="container px-4 py-6" *ngIf="item() as n">
  <h1 class="text-2xl font-bold mb-1">{{ n.title }}</h1>
  <div class="text-sm text-slate-500 mb-2">
    {{ n.publishedAt ? (n.publishedAt | date:'medium') : '' }}
    <span *ngIf="n.authorName"> • {{ n.authorName }}</span>
  </div>
  <img *ngIf="n.coverImageUrl" [src]="n.coverImageUrl" class="w-full max-h-[420px] object-cover rounded-xl mb-4" (error)="usePlaceholder($event)">
  <article class="prose max-w-none" [innerHTML]="safeHtml()"></article>
</section>
  `
})
export class NewsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(NewsService);
  private sanitizer = inject(DomSanitizer);

  item = signal<News | null>(null);
  safeHtml = signal<SafeHtml>('');
  placeholder = 'assets/img/placeholder.png';

  ngOnInit(){
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.getBySlug(slug).subscribe(n => {
      this.item.set(n);
      this.safeHtml.set(this.sanitizer.bypassSecurityTrustHtml(n?.content || ''));
    });
  }
  usePlaceholder(ev: Event){ (ev.target as HTMLImageElement).src = this.placeholder; }
}
