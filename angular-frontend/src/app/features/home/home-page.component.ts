import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BannerCarouselComponent } from './banner-carousel.component';
import { FlashDealsCarouselComponent } from '../../shared/components/home/flash-deals-carousel.component';
import { NewProductsSectionComponent } from '../../shared/components/home/new-products-section.component';

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [CommonModule, BannerCarouselComponent, FlashDealsCarouselComponent, NewProductsSectionComponent],
  styles: [`
    .sep{
      height: 28px; margin: 8px auto 0; position:relative; max-width: 1120px;
      background: radial-gradient(120px 12px at 50% 0, rgba(244,63,94,.25), transparent 70%),
                  linear-gradient(90deg, transparent, rgba(244,63,94,.12), transparent);
      border-radius: 999px;
    }
  `],
  template: `
    <app-banner-carousel></app-banner-carousel>

    <section class="container px-4 pt-4">
      <app-flash-deals-carousel [speedSec]="80" [cardWidth]="208" [imgHeight]="148"></app-flash-deals-carousel>
    </section>

    <!-- separator tạo nhịp -->
    <div class="sep"></div>

    <section class="container px-4 pt-4 pb-6">
      <app-new-products-section></app-new-products-section>
    </section>
  `
})
export class HomePageComponent {}
