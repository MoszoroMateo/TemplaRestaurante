# Server-Sent Events (SSE) — Templa Frontend V2

For a restaurant dashboard, keeping the kitchen, waiters, and admin synced in real-time is crucial. 

Instead of heavy WebSockets or inefficient short-polling, we use **Server-Sent Events (SSE)**. It is a native browser technology that streams events over a single HTTP connection.

---

## 1. Professional SSE Service Pattern

This service connects to your backend's SSE stream and exposes real-time data cleanly using Angular **Signals**.

```typescript
import { Injectable, signal, computed, NgZone, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationRealtimeService {
  private zone = inject(NgZone);
  private eventSource: EventSource | null = null;

  // States
  private connectedState = signal<boolean>(false);
  private lastNotificationState = signal<any | null>(null);

  // Read-only slices
  isConnected = computed(() => this.connectedState());
  lastNotification = computed(() => this.lastNotificationState());

  connect(url: string): void {
    if (this.eventSource) return;

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      // Must run inside Angular's NgZone so state changes trigger UI render
      this.zone.run(() => {
        this.connectedState.set(true);
        console.log('Real-time connection established.');
      });
    };

    // Listening for generic event
    this.eventSource.onmessage = (event) => {
      this.zone.run(() => {
        const data = JSON.parse(event.data);
        this.lastNotificationState.set(data);
      });
    };

    // Listening for a specific named event, e.g. "kitchen-update"
    this.eventSource.addEventListener('kitchen-update', (event: any) => {
      this.zone.run(() => {
        const data = JSON.parse(event.data);
        console.log('Kitchen update received:', data);
        // Dispatch to kitchen service or update global signals state here
      });
    });

    this.eventSource.onerror = (error) => {
      this.zone.run(() => {
        this.connectedState.set(false);
        console.error('Real-time connection failed. Retrying...');
      });
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.connectedState.set(false);
    }
  }
}
```

---

## 2. Advantages over WebSockets (stompjs)
- **Automatic Reconnection**: Browsers automatically reconnect when SSE connections drop.
- **HTTP/2 Friendly**: Works seamlessly over standard port 80/443, bypassing firewalls that block custom WebSockets.
- **Very Light**: No external libraries (like `sockjs-client` or `@stomp/stompjs`) needed. Zero dependency bloat!
