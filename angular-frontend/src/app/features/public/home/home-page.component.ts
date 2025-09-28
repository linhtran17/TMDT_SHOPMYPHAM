// src/app/features/public/home/home-page.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BannerCarouselComponent } from './banner-carousel.component';
import { FlashDealsCarouselComponent } from '../../../shared/components/home/flash-deals-carousel.component';
import { NewProductsSectionComponent } from '../../../shared/components/home/new-products-section.component';
import { RootCategoriesStripComponent } from '../../../shared/components/home/root-categories-strip.component';

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [
    CommonModule,
    BannerCarouselComponent,
    FlashDealsCarouselComponent,
    NewProductsSectionComponent,
    RootCategoriesStripComponent
  ],
  styles: [`
    .sep{
      height: 28px; margin: 8px auto 0; position:relative; max-width: 1200px;
      background: radial-gradient(120px 12px at 50% 0, rgba(244,63,94,.25), transparent 70%),
                  linear-gradient(90deg, transparent, rgba(244,63,94,.12), transparent);
      border-radius: 999px;
    }
    .section{ padding: 12px 0 6px; }
    .container{ max-width: 1200px; margin: 0 auto; }
  `],
  template: `
    <app-banner-carousel></app-banner-carousel>

    <section class="container px-4 pt-4">
      <app-flash-deals-carousel
        [speedSec]="80"
        [cardWidth]="208"
        [imgHeight]="148">
      </app-flash-deals-carousel>
    </section>

    <section class="container px-3 pt-3 pb-5">
      <app-new-products-section></app-new-products-section>
    </section>

    <div class="sep"></div>

    <!-- DANH MỤC NỔI BẬT (to hơn) -->
    <app-root-categories-strip
      title="Danh mục nổi bật"
      subtitle="Khám phá theo nhu cầu của bạn"
      [viewAllRoute]="['/categories']"
      viewAllText="Xem tất cả"
      [maxWidth]="1280"
      [cardWidth]="360"
      [imgHeight]="200"
      [gap]="16">
    </app-root-categories-strip>
  `
})
export class HomePageComponent {}
