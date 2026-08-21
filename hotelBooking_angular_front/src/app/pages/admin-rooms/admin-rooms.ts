import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

import { AdminActions } from '../../actions/admin.actions';
import {
  selectAdminHotels, selectAdminHotelsLoading, selectAdminRooms,
  selectAdminRoomsLoading, selectAdminSaving, selectAdminSelectedHotelId,
} from '../../selectors/admin.selectors';
import { RoomDto } from '../../core/api';
import { EmptyState } from '../../shared/empty-state';
import { ImageUrlPipe } from '../../shared/image-url.pipe';
import { MoneyPipe } from '../../shared/money.pipe';
import { confirmAction } from '../../shared/confirm-dialog';
import { errorMessage } from '../../core/error-message';

@Component({
  selector: 'app-admin-rooms',
  imports: [
    MatCardModule, MatButtonModule, MatFormFieldModule, MatProgressBarModule,
    MatIconModule, MatSelectModule, MatTooltipModule, EmptyState, ImageUrlPipe, MoneyPipe,
  ],
  templateUrl: './admin-rooms.html',
  styleUrl: './admin-rooms.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRooms {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly hotels = toSignal(this.store.select(selectAdminHotels), { initialValue: [] });
  readonly hotelsLoading = toSignal(this.store.select(selectAdminHotelsLoading), { initialValue: false });
  readonly rooms = toSignal(this.store.select(selectAdminRooms), { initialValue: [] });
  readonly roomsLoading = toSignal(this.store.select(selectAdminRoomsLoading), { initialValue: false });
  readonly saving = toSignal(this.store.select(selectAdminSaving), { initialValue: false });
  readonly selectedHotelId = toSignal(this.store.select(selectAdminSelectedHotelId), { initialValue: null });

  constructor() {
    this.store.dispatch(AdminActions.loadHotels());

    this.actions$
      .pipe(ofType(AdminActions.saveRoomSuccess), takeUntilDestroyed())
      .subscribe(({ wasEditing }) =>
        this.snackBar.open(wasEditing ? 'Номер обновлён' : 'Номер добавлен', 'OK', { duration: 4000 })
      );

    this.actions$
      .pipe(ofType(AdminActions.deleteRoomSuccess), takeUntilDestroyed())
      .subscribe(() => this.snackBar.open('Номер удалён', 'OK', { duration: 4000 }));

    this.actions$
      .pipe(
        ofType(
          AdminActions.loadHotelsFailure, AdminActions.loadRoomsFailure,
          AdminActions.saveRoomFailure, AdminActions.deleteRoomFailure,
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ error }) =>
        this.snackBar.open(errorMessage(error, 'Не удалось выполнить действие'), 'Понятно', { duration: 6000 })
      );
  }

  selectHotel(hotelId: string): void {
    this.store.dispatch(AdminActions.selectHotel({ id: hotelId }));
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(room: RoomDto): void {
    this.openForm(room);
  }

  /** См. AdminHotels: форма вынесена из потока страницы в диалог. */
  private openForm(room: RoomDto | null): void {
    import('./room-form-dialog').then(({ RoomFormDialog }) => {
      this.dialog
        .open(RoomFormDialog, {
          data: { room, hotels: this.hotels(), hotelId: this.selectedHotelId() ?? '' },
          width: '720px',
          maxWidth: '95vw',
          autoFocus: 'first-tabbable',
        })
        .afterClosed()
        .subscribe((payload: FormData | undefined) => {
          if (!payload) return;
          this.store.dispatch(AdminActions.saveRoom({ id: room?.id ?? null, payload }));
        });
    });
  }

  delete(room: RoomDto): void {
    confirmAction(this.dialog, {
      title: 'Удалить номер?',
      message: 'Номер пропадёт из поиска. Если по нему есть активные брони, сначала отмените их.',
      confirmLabel: 'Удалить номер',
      destructive: true,
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.store.dispatch(AdminActions.deleteRoom({ id: room.id }));
    });
  }
}
