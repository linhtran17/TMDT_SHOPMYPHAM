import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ChatWidgetComponent } from '../../../shared/components/chat-widget/chat-widget.component';

@Component({
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ChatWidgetComponent],
  template: `
    <app-header></app-header>
    <router-outlet></router-outlet>
    <app-footer></app-footer>

    <!-- Chatbot nổi -->
    <app-chat-widget></app-chat-widget>
  `
})
export class PublicLayoutComponent {}
