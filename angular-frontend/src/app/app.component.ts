// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/toast/toast';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent], // 👈 phải có
  template: `
    <router-outlet></router-outlet>
    <app-toast-container></app-toast-container>
  `
})
export class AppComponent {}
