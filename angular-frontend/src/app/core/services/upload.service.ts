import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

interface UploadRes { url: string; secureUrl: string; publicId: string; format: string; bytes: number; }
interface ApiResponse<T> { success: boolean; message?: string | null; data: T; }

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);

  /** Upload đơn giản (không cần progress) */
  upload(file: File, folder = 'categories') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    return this.http.post<ApiResponse<UploadRes>>('/api/upload', fd);
  }

  /** Upload có theo dõi progress */
  uploadWithProgress(file: File, folder = 'categories'): Observable<HttpEvent<ApiResponse<UploadRes>>> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    return this.http.post<ApiResponse<UploadRes>>('/api/upload', fd, {
      reportProgress: true,
      observe: 'events'
    });
  }
}
