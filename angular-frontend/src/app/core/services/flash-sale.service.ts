import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { map, Observable } from 'rxjs';
import { FlashDeal, FlashSaleDto } from '../models/flash-sale.model';

@Injectable({ providedIn: 'root' })
export class FlashSaleService {
  private api = inject(ApiService);

  getActiveDeals(limit = 8): Observable<FlashDeal[]> {
    return this.api.get<any>('/api/flash-sales/deals', { limit })
      .pipe(map(r => r?.data ?? r));
  }

  getBySlug(slug: string): Observable<FlashSaleDto> {
    return this.api.get<any>(`/api/flash-sales/${slug}`)
      .pipe(map(r => r?.data ?? r));
  }
}
