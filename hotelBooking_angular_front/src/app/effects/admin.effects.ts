import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, concatMap, map, of, switchMap, take } from 'rxjs';

import { AdminActions } from '../actions/admin.actions';
import { ApolloService } from '../graphql/apollo.service';
import { Api } from '../core/api';
import { selectAdminSelectedHotelId } from '../selectors/admin.selectors';

@Injectable()
export class AdminEffects {
  private readonly actions$ = inject(Actions);
  private readonly apollo = inject(ApolloService);
  /** REST остался только под multipart: форма возит файлы. */
  private readonly api = inject(Api);
  private readonly store = inject(Store);

  readonly loadHotels$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadHotels),
      switchMap(() =>
        this.apollo.adminGetHotels({ limit: 50 }).pipe(
          map((page) => AdminActions.loadHotelsSuccess({ items: page.items })),
          catchError((error) => of(AdminActions.loadHotelsFailure({ error })))
        )
      )
    )
  );

  readonly saveHotel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.saveHotel),
      concatMap(({ id, payload }) =>
        (id ? this.api.updateHotel(id, payload) : this.api.createHotel(payload)).pipe(
          map(() => AdminActions.saveHotelSuccess({ wasEditing: !!id })),
          catchError((error) => of(AdminActions.saveHotelFailure({ error })))
        )
      )
    )
  );

  /** После сохранения список перечитывается: сервер мог поправить поля. */
  readonly reloadHotelsAfterSave$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.saveHotelSuccess),
      map(() => AdminActions.loadHotels())
    )
  );

  readonly deleteHotel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.deleteHotel),
      concatMap(({ id }) =>
        this.apollo.deleteHotel(id).pipe(
          map(() => AdminActions.deleteHotelSuccess({ id })),
          catchError((error) => of(AdminActions.deleteHotelFailure({ error })))
        )
      )
    )
  );

  readonly loadRoomsOnSelect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.selectHotel),
      map(({ id }) => AdminActions.loadRooms({ hotelId: id }))
    )
  );

  readonly loadRooms$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadRooms),
      switchMap(({ hotelId }) =>
        this.apollo.adminGetRooms(hotelId).pipe(
          map((items) => AdminActions.loadRoomsSuccess({ items })),
          catchError((error) => of(AdminActions.loadRoomsFailure({ error })))
        )
      )
    )
  );

  readonly saveRoom$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.saveRoom),
      concatMap(({ id, payload }) =>
        (id ? this.api.updateRoom(id, payload) : this.api.createRoom(payload)).pipe(
          map(() => AdminActions.saveRoomSuccess({ wasEditing: !!id })),
          catchError((error) => of(AdminActions.saveRoomFailure({ error })))
        )
      )
    )
  );

  readonly reloadRoomsAfterSave$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.saveRoomSuccess),
      concatMap(() =>
        this.store.select(selectAdminSelectedHotelId).pipe(
          take(1),
          // Номер могли создать для другого отеля — тогда перечитывать нечего
          map((hotelId) => (hotelId ? AdminActions.loadRooms({ hotelId }) : AdminActions.loadHotels()))
        )
      )
    )
  );

  readonly deleteRoom$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.deleteRoom),
      concatMap(({ id }) =>
        this.apollo.deleteRoom(id).pipe(
          map(() => AdminActions.deleteRoomSuccess({ id })),
          catchError((error) => of(AdminActions.deleteRoomFailure({ error })))
        )
      )
    )
  );
}
