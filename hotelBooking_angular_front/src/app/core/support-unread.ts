import { Injectable, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, switchMap } from 'rxjs';

import { ApolloService } from '../graphql/apollo.service';
import { selectAuthUser } from '../selectors/auth.selectors';

/**
 * Количество непрочитанных сообщений поддержки — для отметки в меню.
 *
 * Обновляется при входе и после каждого действия в переписке. Живой доставки
 * пока нет: она появится вместе с подключением Socket.IO на клиенте (F-1),
 * сейчас чат работает через запрос-ответ.
 */
@Injectable({ providedIn: 'root' })
export class SupportUnread {
  private readonly apollo = inject(ApolloService);

  readonly count = signal(0);

  constructor() {
    // Гость и администратор в поддержку не ходят — запрос им вернёт отказ по роли.
    inject(Store)
      .select(selectAuthUser)
      .pipe(
        filter((user) => user?.role === 'client' || user?.role === 'manager'),
        switchMap(() => this.apollo.getUnreadSupportCount())
      )
      .subscribe({
        next: (count) => this.count.set(count),
        error: () => this.count.set(0),
      });
  }

  refresh(): void {
    this.apollo.getUnreadSupportCount().subscribe({
      next: (count) => this.count.set(count),
      error: () => this.count.set(0),
    });
  }
}
