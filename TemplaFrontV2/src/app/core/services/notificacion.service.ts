import { Injectable, inject, NgZone, signal, computed } from '@angular/core';
import { Notification } from '../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private zone = inject(NgZone);
  private eventSource: EventSource | null = null;

  // ── Reactive state ──
  private notificationsState = signal<Notification[]>([]);
  private connectedState = signal(false);

  // ── Public slices ──
  notifications = computed(() => this.notificationsState());
  unread = computed(() => this.notificationsState().filter(n => !n.read));
  unreadCount = computed(() => this.unread().length);
  connected = computed(() => this.connectedState());

  // ── SSE Connection ──
  connect(): void {
    if (this.eventSource) return;

    const url = `${environment.apiUrl}/sse/test`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      this.zone.run(() => this.connectedState.set(true));
    };

    this.eventSource.onmessage = (event) => {
      this.zone.run(() => {
        try {
          const notif: Notification = JSON.parse(event.data);
          notif.read = false;
          this.notificationsState.update(list => [notif, ...list].slice(0, 50));
        } catch {
          console.warn('NotificationService: error parsing SSE');
        }
      });
    };

    this.eventSource.onerror = () => {
      this.zone.run(() => this.connectedState.set(false));
    };
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this.connectedState.set(false);
  }

  markAsRead(): void {
    this.notificationsState.update(list =>
      list.map(n => ({ ...n, read: true }))
    );
  }

  clearAll(): void {
    this.notificationsState.set([]);
  }
}