// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/toast/toast';
import { LoadingOverlayComponent } from './shared/ui/loading-overlay';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, LoadingOverlayComponent],
  template: `
    <router-outlet></router-outlet>

    <!-- Toast hiển thị toàn app -->
    <app-toast-container></app-toast-container>

    <!-- Loading overlay toàn app -->
    <app-loading-overlay></app-loading-overlay>
  `
})
export class AppComponent {}
