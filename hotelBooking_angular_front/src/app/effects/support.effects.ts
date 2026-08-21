import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, concatMap, map, of, switchMap, take, tap } from 'rxjs';
import { SupportActions } from '../actions/support.actions';
import { ApolloService } from '../graphql/apollo.service';
import { SupportUnread } from '../core/support-unread';
import { selectAuthUser } from '../selectors/auth.selectors';
import { selectSupportSelectedId } from '../selectors/support.selectors';

@Injectable()
export class SupportEffects {
  private readonly actions$ = inject(Actions);
  private readonly apolloService = inject(ApolloService);
  private readonly unread = inject(SupportUnread);
  private readonly store = inject(Store);

  readonly loadSupportRequests$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupportActions.loadSupportRequests),
      switchMap(() =>
        this.store.select(selectAuthUser).pipe(
          take(1),
          concatMap((user) => {
            const call$ =
              user?.role === 'manager'
                ? this.apolloService.getManagerSupportRequests()
                : this.apolloService.getClientSupportRequests();
            return call$.pipe(
              map((items) => SupportActions.loadSupportRequestsSuccess({ items })),
              catchError((error) => of(SupportActions.loadSupportRequestsFailure({ error })))
            );
          })
        )
      )
    )
  );

  readonly closeSupportRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupportActions.closeSupportRequest),
      concatMap(({ id }) =>
        this.apolloService.closeSupportRequest(id).pipe(
          map(() => SupportActions.closeSupportRequestSuccess({ id })),
          catchError((error) => of(SupportActions.closeSupportRequestFailure({ error })))
        )
      )
    )
  );

  // Создание обращения переведено на GraphQL: REST-эндпоинта, в который
  // этот эффект ходил раньше, на сервере не существовало.
  readonly createSupportRequest$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupportActions.createSupportRequest),
      concatMap(({ text }) =>
        this.apolloService.createSupportRequest(text).pipe(
          map((item) => SupportActions.createSupportRequestSuccess({ item })),
          catchError((error) => of(SupportActions.createSupportRequestFailure({ error })))
        )
      )
    )
  );

  /** Выбор обращения сам по себе ничего не грузит — загрузку запускает этот эффект. */
  readonly loadMessagesOnSelect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupportActions.selectRequest),
      map(({ id }) => SupportActions.loadMessages({ requestId: id }))
    )
  );

  readonly loadMessages$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupportActions.loadMessages),
      // switchMap: при быстром переключении между обращениями нужна
      // последняя переписка, ответ на предыдущий выбор уже не нужен
      switchMap(({ requestId }) =>
        this.apolloService.getSupportMessages(requestId).pipe(
          map((messages) => SupportActions.loadMessagesSuccess({ messages })),
          catchError((error) => of(SupportActions.loadMessagesFailure({ error })))
        )
      )
    )
  );

  /**
   * Открыли переписку — сообщения собеседника прочитаны.
   * Сервер возвращает оставшееся количество, оно и попадает в отметку меню.
   */
  readonly markRead$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SupportActions.loadMessagesSuccess),
        concatMap(() =>
          this.store.select(selectSupportSelectedId).pipe(
            take(1),
            concatMap((id) => (id ? this.apolloService.markSupportMessagesRead(id) : of(null)))
          )
        ),
        tap((left) => {
          if (left !== null) this.unread.count.set(left);
        }),
        catchError(() => of(null))
      ),
    { dispatch: false }
  );

  readonly sendMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupportActions.sendMessage),
      // concatMap: сообщения должны уйти в том порядке, в каком их написали
      concatMap(({ requestId, text }) =>
        this.apolloService.sendSupportMessage(requestId, text).pipe(
          map((message) => SupportActions.sendMessageSuccess({ message })),
          catchError((error) => of(SupportActions.sendMessageFailure({ error, text })))
        )
      )
    )
  );
}
