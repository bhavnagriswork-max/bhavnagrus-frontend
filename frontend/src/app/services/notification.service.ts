import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: Notification[] = [];
  private notificationSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationSubject.asObservable();
  private counter = 0;

  show(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = this.counter++;
    const notification: Notification = { message, type, id };
    this.notifications.push(notification);
    this.notificationSubject.next([...this.notifications]);

    setTimeout(() => {
      this.remove(id);
    }, 4000);
  }

  remove(id: number) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notificationSubject.next([...this.notifications]);
  }
}
