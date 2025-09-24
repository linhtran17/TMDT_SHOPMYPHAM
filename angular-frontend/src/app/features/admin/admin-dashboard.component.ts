import {
  Component,
  effect,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  AnalyticsService,
  SummaryResponse,
  DayPoint,
  TopProductRow,
  LowStockRow,
  CouponUsageRow,
  CustomersOverview
} from '../../core/services/analytics.service';

import { Chart, ChartConfiguration, ChartOptions, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, CurrencyPipe, DecimalPipe],
  styles: [`
    .grid{ display:grid; gap:1rem; }
    .grid-3{ grid-template-columns: repeat(3, minmax(0,1fr)); }
    .card{ @apply bg-white border rounded-2xl p-5 shadow-sm; }
    .kpi{ @apply text-xs uppercase tracking-wide text-slate-500; }
    .kpi-value{ @apply text-3xl font-extrabold text-slate-900; }
    .toolbar{ @apply flex flex-wrap items-center gap-2; }
    .input{ @apply h-10 rounded-xl border border-slate-300 px-3 bg-white; }
    .btn{ @apply h-10 px-4 rounded-xl bg-rose-600 text-white hover:bg-rose-700; }
    .btn-ghost{ @apply h-9 px-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200; }
    .chip{ @apply h-9 px-3 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200; }
    table{ @apply w-full text-sm; border-collapse: collapse; }
    th, td{ @apply border-b border-slate-200 py-2 text-left; }
    th{ @apply text-slate-500 font-medium; }
    .badge{ @apply inline-flex items-center px-2 py-0.5 text-xs rounded-lg bg-slate-100; }
    .chart-wrap{ position:relative; height:320px; }
    .muted{ @apply text-slate-500; }
    .section-title{ @apply flex items-center justify-between mb-2; }
    .skeleton{ @apply animate-pulse bg-slate-200 rounded-lg; }
    .card-header{ @apply flex items-center justify-between mb-3; }
    .title{ @apply text-xl font-semibold text-slate-900; }
    .subtitle{ @apply text-sm text-slate-500; }
    .icon{ @apply inline-flex items-center justify-center w-10 h-10 rounded-xl; }
  `],
  template: `
  <div class="card mb-4">
    <div class="card-header">
      <div>
        <div class="title">Bảng điều khiển bán hàng</div>
        <div class="subtitle">Tổng quan hiệu suất theo khoảng thời gian</div>
      </div>

      <div class="toolbar">
        <input class="input" type="date" [(ngModel)]="from" />
        <input class="input" type="date" [(ngModel)]="to" />
        <button class="btn" (click)="apply()">Áp dụng</button>
        <div class="hidden md:flex items-center gap-2">
          <button class="chip" (click)="quick('7')">7 ngày</button>
          <button class="chip" (click)="quick('30')">30 ngày</button>
          <button class="chip" (click)="quick('90')">90 ngày</button>
        </div>
      </div>
    </div>

    <div class="grid grid-3">
      <div class="card">
        <div class="flex items-center gap-3">
          <div class="icon bg-rose-100 text-rose-700">📦</div>
          <div>
            <div class="kpi">Tổng đơn</div>
            <div class="kpi-value">
              <ng-container *ngIf="!loading(); else sk1">{{ summary()?.totalOrders ?? 0 | number }}</ng-container>
            </div>
            <div class="text-xs muted">Đã thanh toán: {{ summary()?.paidOrders ?? 0 | number }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center gap-3">
          <div class="icon bg-emerald-100 text-emerald-700">💰</div>
          <div>
            <div class="kpi">Tổng doanh thu</div>
            <div class="kpi-value">
              <ng-container *ngIf="!loading(); else sk2">
                {{ summary()?.totalRevenue ?? 0 | number:'1.0-0' }} đ
              </ng-container>
            </div>
            <div class="text-xs muted">Doanh thu paid: {{ summary()?.paidRevenue ?? 0 | number:'1.0-0' }} đ</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center gap-3">
          <div class="icon bg-indigo-100 text-indigo-700">📈</div>
          <div>
            <div class="kpi">AOV (giá trị đơn TB)</div>
            <div class="kpi-value">
              <ng-container *ngIf="!loading(); else sk3">{{ summary()?.aov ?? 0 | number:'1.0-0' }} đ</ng-container>
            </div>
            <div class="text-xs muted">Sản phẩm đang bán: {{ summary()?.activeProducts ?? 0 | number }}</div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #sk1><div class="skeleton w-24 h-6"></div></ng-template>
    <ng-template #sk2><div class="skeleton w-28 h-6"></div></ng-template>
    <ng-template #sk3><div class="skeleton w-20 h-6"></div></ng-template>
  </div>

  <div class="grid md:grid-cols-[2fr_1fr] gap-4 mb-4">
    <div class="card">
      <div class="section-title">
        <div class="font-semibold">Doanh thu theo ngày</div>
        <button class="btn-ghost" (click)="toggleSmooth()">
          {{ smooth() ? 'Đường gấp khúc' : 'Làm mượt đường' }}
        </button>
      </div>

      <div class="chart-wrap">
        <canvas #lineCanvas></canvas>
      </div>
      <div *ngIf="!loading() && (series()?.length||0)===0" class="text-sm muted mt-2">Chưa có dữ liệu trong khoảng ngày.</div>
    </div>

    <div class="card">
      <div class="section-title">
        <div class="font-semibold">Đơn theo trạng thái</div>
      </div>

      <div class="chart-wrap" style="height:280px">
        <canvas #pieCanvas></canvas>
      </div>
      <div *ngIf="!loading() && (summary()?.byStatus?.length||0)===0" class="text-sm muted mt-2">Không có đơn nào.</div>
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-4 mb-4">
    <div class="card">
      <div class="section-title">
        <div class="font-semibold">Top sản phẩm (Top {{ topLimit }})</div>
        <div class="flex items-center gap-2">
          <input class="input w-24" type="number" [(ngModel)]="topLimit" min="5" step="5" />
          <button class="btn-ghost" (click)="apply()">Cập nhật</button>
        </div>
      </div>

      <ng-container *ngIf="!loading() && (topProducts()?.length || 0) > 0; else noTop">
        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th class="text-right">SL</th>
              <th class="text-right">Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of topProducts()">
              <td>
                <div class="font-medium">{{ p.name }}</div>
                <div class="text-xs muted">#{{ p.sku }}</div>
              </td>
              <td class="text-right">{{ p.qty | number }}</td>
              <td class="text-right">{{ p.revenue | number:'1.0-0' }} đ</td>
            </tr>
          </tbody>
        </table>
      </ng-container>
      <ng-template #noTop>
        <div class="text-sm muted">Chưa có dữ liệu.</div>
      </ng-template>
    </div>

    <div class="card">
      <div class="section-title">
        <div class="font-semibold">Hàng sắp hết (≤ {{ lowThreshold }})</div>
        <div class="flex items-center gap-2">
          <input class="input w-28" type="number" [(ngModel)]="lowThreshold" min="0" />
          <button class="btn-ghost" (click)="apply()">Cập nhật</button>
        </div>
      </div>

      <ng-container *ngIf="!loading() && (lowStock()?.length || 0) > 0; else noLow">
        <table>
          <thead>
            <tr><th>Sản phẩm</th><th class="text-right">Tồn</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let i of lowStock()">
              <td>
                <div class="font-medium">{{ i.name }}</div>
                <div class="text-xs muted">#{{ i.sku }}</div>
              </td>
              <td class="text-right">{{ i.stock | number }}</td>
            </tr>
          </tbody>
        </table>
      </ng-container>
      <ng-template #noLow>
        <div class="text-sm muted">Tạm thời chưa có hàng sắp hết.</div>
      </ng-template>
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-4">
    <div class="card">
      <div class="font-semibold mb-2">Sử dụng mã giảm giá</div>
      <ng-container *ngIf="!loading() && (couponUsage()?.length || 0) > 0; else noCoupon">
        <table>
          <thead>
          <tr>
            <th>Mã</th>
            <th class="text-right">Lượt</th>
            <th class="text-right">Giảm</th>
            <th class="text-right">Doanh thu ảnh hưởng</th>
          </tr>
          </thead>
          <tbody>
          <tr *ngFor="let c of couponUsage()">
            <td><span class="badge">{{ c.code }}</span></td>
            <td class="text-right">{{ c.usageCount | number }}</td>
            <td class="text-right">{{ c.totalDiscount | number:'1.0-0' }} đ</td>
            <td class="text-right">{{ c.impactedRevenue | number:'1.0-0' }} đ</td>
          </tr>
          </tbody>
        </table>
      </ng-container>
      <ng-template #noCoupon>
        <div class="text-sm muted">Chưa có mã nào được dùng.</div>
      </ng-template>
    </div>

    <div class="card">
      <div class="font-semibold mb-2">Khách hàng</div>
      <div class="grid grid-cols-2 gap-2 mb-2">
        <div>
          <div class="kpi">Khách hàng duy nhất</div>
          <div class="kpi-value">{{ customers()?.uniqueCustomers ?? 0 | number }}</div>
        </div>
        <div>
          <div class="kpi">Tỉ lệ quay lại</div>
          <div class="kpi-value">{{ customers()?.repeatRate ?? 0 }}%</div>
        </div>
      </div>
      <div class="text-sm font-medium mb-1">Top tỉnh/thành</div>
      <ng-container *ngIf="!loading() && (customers()?.topProvinces?.length || 0) > 0; else noProv">
        <table>
          <thead><tr><th>Tỉnh/Thành</th><th class="text-right">Đơn</th></tr></thead>
        <tbody>
          <tr *ngFor="let p of (customers()?.topProvinces || [])">
            <td>{{ p[0] }}</td>
            <td class="text-right">{{ p[1] | number }}</td>
          </tr>
        </tbody>
        </table>
      </ng-container>
      <ng-template #noProv>
        <div class="text-sm muted">Chưa có thống kê.</div>
      </ng-template>
    </div>
  </div>
  `
})
export class AdminDashboardComponent implements AfterViewInit, OnDestroy {
  private api = inject(AnalyticsService);

  @ViewChild('lineCanvas') lineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas')  pieCanvas!:  ElementRef<HTMLCanvasElement>;
  private lineChart?: Chart;
  private pieChart?:  Chart;

  // ====== FIX: lấy ngày LOCAL, không dùng toISOString() ======
  from = toLocalISODate(offsetDaysLocal(-30));
  to   = toLocalISODate(new Date());

  topLimit = 10;
  lowThreshold = 5;

  loading = signal<boolean>(true);
  smooth  = signal<boolean>(true);

  summary      = signal<SummaryResponse | null>(null);
  series       = signal<DayPoint[]>([]);
  topProducts  = signal<TopProductRow[]>([]);
  lowStock     = signal<LowStockRow[]>([]);
  couponUsage  = signal<CouponUsageRow[]>([]);
  customers    = signal<CustomersOverview | null>(null);

  constructor() {
    this.reload();
    effect(() => this.renderLineChart(this.series()));
    effect(() => this.renderPieChart(this.summary()?.byStatus ?? []));
  }

  ngAfterViewInit(): void {
    this.renderLineChart(this.series());
    this.renderPieChart(this.summary()?.byStatus ?? []);
  }

  ngOnDestroy(): void {
    this.lineChart?.destroy();
    this.pieChart?.destroy();
  }

  apply() {
    if (this.from && this.to && this.from > this.to) [this.from, this.to] = [this.to, this.from];
    this.reload();
  }

  quick(days: '7'|'30'|'90') {
    this.from = toLocalISODate(offsetDaysLocal(-Number(days)));
    this.to   = toLocalISODate(new Date());
    this.reload();
  }

  toggleSmooth() {
    this.smooth.set(!this.smooth());
    this.renderLineChart(this.series());
  }

  reload() {
    this.loading.set(true);
    const from = this.from, to = this.to;

    let remaining = 6;
    const done = () => { remaining--; if (remaining === 0) this.loading.set(false); };

    this.api.summary(from, to).subscribe({ next: r => this.summary.set(r), complete: done, error: done });
    this.api.salesSeries(from, to).subscribe({ next: r => this.series.set(r), complete: done, error: done });
    this.api.topProducts(from, to, undefined, this.topLimit).subscribe({ next: r => this.topProducts.set(r), complete: done, error: done });
    this.api.lowStock(this.lowThreshold, 10).subscribe({ next: r => this.lowStock.set(r), complete: done, error: done });
    this.api.couponUsage(from, to).subscribe({ next: r => this.couponUsage.set(r), complete: done, error: done });
    this.api.customersOverview(from, to).subscribe({ next: r => this.customers.set(r), complete: done, error: done });
  }

  private renderLineChart(data: DayPoint[]) {
    if (!this.lineCanvas) return;

    const arr = Array.isArray(data) ? data : [];
    // ====== UI: hiển thị nhãn ngày theo vi-VN ======
    const df = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });
    const labels  = arr.map(d => df.format(new Date(d.date + 'T00:00:00'))); // d.date = yyyy-MM-dd
    const revenue = arr.map(d => Number(d.revenue));
    const orders  = arr.map(d => Number(d.orders));

    const ctx = this.lineCanvas.nativeElement.getContext('2d')!;
    const grad1 = ctx.createLinearGradient(0, 0, 0, 320);
    grad1.addColorStop(0, 'rgba(79, 70, 229, 0.25)');
    grad1.addColorStop(1, 'rgba(79, 70, 229, 0.00)');

    const grad2 = ctx.createLinearGradient(0, 0, 0, 320);
    grad2.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    grad2.addColorStop(1, 'rgba(16, 185, 129, 0.00)');

    this.lineChart?.destroy();

    const cfg: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Doanh thu (đ)',
            data: revenue,
            borderColor: '#4f46e5',
            backgroundColor: grad1,
            pointRadius: 2,
            pointHoverRadius: 4,
            fill: true,
            tension: this.smooth() ? 0.35 : 0
          },
          {
            label: 'Số đơn',
            data: orders,
            borderColor: '#10b981',
            backgroundColor: grad2,
            pointRadius: 2,
            pointHoverRadius: 4,
            fill: true,
            tension: this.smooth() ? 0.35 : 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { ticks: { maxRotation: 0, autoSkip: true } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148,163,184,0.2)' }
          }
        },
        plugins: {
          legend: { display: true, position: 'bottom' },
          tooltip: {
            callbacks: {
              label(ctx) {
                const v = ctx.parsed.y ?? 0;
                const name = ctx.dataset.label || '';
                return `${name}: ${new Intl.NumberFormat('vi-VN').format(v)}`;
              }
            }
          }
        }
      } as ChartOptions<'line'>
    };

    this.lineChart = new Chart(ctx, cfg);
  }

  private renderPieChart(byStatus: [string, number][]) {
    if (!this.pieCanvas) return;

    const rows   = Array.isArray(byStatus) ? byStatus : [];
    const labels = rows.map(r => r[0]);
    const values = rows.map(r => Number(r[1]));
    const total  = values.reduce((a, b) => a + b, 0);

    this.pieChart?.destroy();

    const centerTextPlugin = {
      id: 'centerText',
      afterDraw: (chart: Chart) => {
        const { ctx, chartArea } = chart;
        if (!ctx || !chartArea) return;
        ctx.save();
        const cx = (chartArea.left + chartArea.right) / 2;
        const cy = (chartArea.top + chartArea.bottom) / 2;
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 16px ui-sans-serif, system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(total.toString(), cx, cy + 6);
        ctx.restore();
      }
    };

    const ctx = this.pieCanvas.nativeElement.getContext('2d')!;
    this.pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          label: 'Số đơn',
          data: values,
          backgroundColor: ['#f59e0b','#ef4444','#10b981','#3b82f6','#8b5cf6','#14b8a6','#e11d48'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label(ctx) {
                const label = ctx.label || '';
                const v = ctx.parsed || 0;
                const pct = total ? Math.round((v * 100) / total) : 0;
                return `${label}: ${new Intl.NumberFormat('vi-VN').format(v)} (${pct}%)`;
              }
            }
          }
        }
      } as ChartOptions<'doughnut'>,
      plugins: [centerTextPlugin]
    });
  }
}

/** ===== Helpers: ngày LOCAL chuẩn yyyy-MM-dd ===== */
function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function offsetDaysLocal(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
