import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

import { AdminActions } from '../../actions/admin.actions';
import { selectAdminHotels, selectAdminHotelsLoading, selectAdminSaving } from '../../selectors/admin.selectors';
import { HotelDto } from '../../core/api';
import { EmptyState } from '../../shared/empty-state';
import { ImageUrlPipe } from '../../shared/image-url.pipe';
import { MoneyPipe } from '../../shared/money.pipe';
import { AMENITY_META } from '../../shared/amenities';
import { confirmAction } from '../../shared/confirm-dialog';
import { errorMessage } from '../../core/error-message';

@Component({
  selector: 'app-admin-hotels',
  imports: [
    MatCardModule, MatButtonModule, MatProgressBarModule, MatIconModule,
    MatTooltipModule, EmptyState, MoneyPipe, ImageUrlPipe,
  ],
  templateUrl: './admin-hotels.html',
  styleUrl: './admin-hotels.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHotels {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly hotels = toSignal(this.store.select(selectAdminHotels), { initialValue: [] });
  readonly loading = toSignal(this.store.select(selectAdminHotelsLoading), { initialValue: false });
  readonly saving = toSignal(this.store.select(selectAdminSaving), { initialValue: false });

  readonly amenityMeta = AMENITY_META;

  constructor() {
    this.store.dispatch(AdminActions.loadHotels());

    this.actions$
      .pipe(ofType(AdminActions.saveHotelSuccess), takeUntilDestroyed())
      .subscribe(({ wasEditing }) =>
        this.snackBar.open(wasEditing ? 'Изменения сохранены' : 'Отель создан', 'OK', { duration: 4000 })
      );

    this.actions$
      .pipe(ofType(AdminActions.deleteHotelSuccess), takeUntilDestroyed())
      .subscribe(() => this.snackBar.open('Отель удалён', 'OK', { duration: 4000 }));

    this.actions$
      .pipe(
        ofType(AdminActions.loadHotelsFailure, AdminActions.saveHotelFailure, AdminActions.deleteHotelFailure),
        takeUntilDestroyed(),
      )
      .subscribe(({ error }) =>
        this.snackBar.open(errorMessage(error, 'Не удалось выполнить действие'), 'Понятно', { duration: 6000 })
      );
  }

  loadHotels(): void {
    this.store.dispatch(AdminActions.loadHotels());
  }

  stars(n: number): number[] {
    return Array.from({ length: Math.max(0, Math.min(5, n)) });
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(hotel: HotelDto): void {
    this.openForm(hotel);
  }

  /**
   * Форма живёт в диалоге. Раньше она разворачивалась над списком и сдвигала
   * его вниз: при правке нижнего отеля форма оказывалась за пределами экрана.
   */
  private openForm(hotel: HotelDto | null): void {
    import('./hotel-form-dialog').then(({ HotelFormDialog }) => {
      this.dialog
        .open(HotelFormDialog, { data: { hotel }, width: '720px', maxWidth: '95vw', autoFocus: 'first-tabbable' })
        .afterClosed()
        .subscribe((payload: FormData | undefined) => {
          if (!payload) return;
          this.store.dispatch(AdminActions.saveHotel({ id: hotel?.id ?? null, payload }));
        });
    });
  }

  /** Нативный confirm() заменён диалогом Material. */
  delete(hotel: HotelDto): void {
    confirmAction(this.dialog, {
      title: 'Удалить отель?',
      message: `«${hotel.title}» и все его номера исчезнут из поиска. Активные брони при этом сохранятся.`,
      confirmLabel: 'Удалить отель',
      destructive: true,
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.store.dispatch(AdminActions.deleteHotel({ id: hotel.id }));
    });
  }
}
