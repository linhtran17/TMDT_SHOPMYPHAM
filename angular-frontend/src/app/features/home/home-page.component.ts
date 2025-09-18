import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BannerCarouselComponent } from './banner-carousel.component';
import { FlashDealsCarouselComponent } from '../../shared/components/home/flash-deals-carousel.component';
import { NewProductsSectionComponent } from '../../shared/components/home/new-products-section.component'; // (nếu bạn đã tách như trước) — hoặc giữ phần danh sách cũ của bạn

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [CommonModule, BannerCarouselComponent, FlashDealsCarouselComponent, NewProductsSectionComponent],
  template: `
    <app-banner-carousel></app-banner-carousel>
    <section class="container px-4 pt-4">
  <app-flash-deals-carousel
    [speedSec]="80"
    [cardWidth]="208"
    [imgHeight]="148">
  </app-flash-deals-carousel>
</section>
    <app-new-products-section></app-new-products-section>
  `
})
export class HomePageComponent {}
