# Cloudflare R2 Image Upload — Templa Frontend V2

Since AWS S3 was decommissioned, **Cloudflare R2** is the best, most professional alternative. It is 100% S3-compatible, offers a massive free tier, and charges $0 egress fees.

---

## 1. The Professional Upload Architecture

Do NOT upload files directly from the frontend to R2 using hardcoded credentials. That is a critical security vulnerability. Use the **Presigned URL Pattern**:

```
┌──────────┐            1. GET /api/images/presign            ┌──────────┐
│          ├─────────────────────────────────────────────────>│          │
│ Angular  │                                                  │ Backend  │
│ Frontend │<─────────────────────────────────────────────────┤ (Java)   │
│          │            2. Return presigned PUT URL           │          │
└────┬─────┘                                                  └──────────┘
     │
     │ 3. HTTP PUT file directly to R2
     ▼
┌──────────┐
│Cloudflare│
│    R2    │
└──────────┘
```

---

## 2. Frontend Implementation

### Service upload method (`services/image.service.ts`)
```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8081/api/images';

  uploadImage(file: File): Observable<string> {
    // 1. Ask backend for a presigned PUT URL
    return this.http.get<{ presignedUrl: string; publicUrl: string }>(
      `${this.API_URL}/presign?fileName=${file.name}&contentType=${file.type}`
    ).pipe(
      switchMap((urls) => {
        // 2. Put file directly to Cloudflare R2
        const headers = new HttpHeaders({ 'Content-Type': file.type });
        return this.http.put(urls.presignedUrl, file, { headers }).pipe(
          // 3. Return the public URL for storing in database
          switchMap(() => new Observable<string>(subscriber => {
            subscriber.next(urls.publicUrl);
            subscriber.complete();
          }))
        );
      })
    );
  }
}
```

---

## 3. Backend S3-to-R2 Compatibility
Because Cloudflare R2 is 100% S3-compatible, your backend S3 Java library (like AWS SDK v2) will work by just changing the **endpoint URL**:

Instead of `s3.amazonaws.com`, configure your SDK client to use:
`https://<account-id>.r2.cloudflarestorage.com`

This saves you from rewriting any Java backend S3 storage logic!
