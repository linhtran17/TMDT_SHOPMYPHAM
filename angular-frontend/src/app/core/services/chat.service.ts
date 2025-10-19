import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export type ChatAskPayload = {
  message: string;
  priceMin?: number;
  priceMax?: number;
  topKProducts?: number;
};

export type ChatAskResponse = {
  faqIds: number[];
  answerMd: string;
  products: Array<{
    id: number;
    name: string;
    image?: string | null;
    price?: number | null;
    salePrice?: number | null;
    inStock?: boolean;
    url?: string;
  }>;
};

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);

  // Nếu dùng Angular environments, thay bằng environment.apiBaseUrl
  private baseUrl = ''; // cùng domain => để trống

  private getSessionId(): string {
    let sid = localStorage.getItem('chat_session');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('chat_session', sid);
    }
    return sid;
  }

  ask(body: ChatAskPayload) {
    const headers = new HttpHeaders({ 'X-Chat-Session': this.getSessionId() });
    return this.http.post<ChatAskResponse>(`${this.baseUrl}/api/chat/ask`, body, { headers });
  }

  reset() {
    localStorage.removeItem('chat_session');
    localStorage.removeItem('chat_messages');
    return this.http.post<{ ok: boolean }>(`${this.baseUrl}/api/chat/reset`, {});
  }
}
