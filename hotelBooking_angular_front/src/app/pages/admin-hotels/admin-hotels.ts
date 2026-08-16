import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';

import { Api, HotelDto } from '../../core/api';
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
})
export class AdminHotels implements OnInit {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  hotels: HotelDto[] = [];
  loading = false;
  saving = false;

  readonly amenityMeta = AMENITY_META;

  ngOnInit(): void {
    this.loadHotels();
  }

  loadHotels(): void {
    this.loading = true;
    // Без фиктивных дат 2024 года: раньше админ видел максимум 10 отелей,
    // отфильтрованных по бронированиям того года.
    this.api.getAllHotels({ limit: 50 }).subscribe({
      next: (response) => {
        this.hotels = response.body ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.cdr.markForCheck();
        this.snackBar.open(errorMessage(error, 'Не удалось загрузить отели'), 'Понятно', { duration: 5000 });
      },
    });
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
          this.submit(hotel ? this.api.updateHotel(hotel.id, payload) : this.api.createHotel(payload), !!hotel);
        });
    });
  }

  private submit(call$: Observable<unknown>, wasEditing: boolean): void {
    this.saving = true;
    call$.subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open(wasEditing ? 'Изменения сохранены' : 'Отель создан', 'OK', { duration: 4000 });
        this.loadHotels();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.markForCheck();
        this.snackBar.open(errorMessage(error, 'Не удалось сохранить'), 'Понятно', { duration: 6000 });
      },
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
      this.api.deleteHotel(hotel.id).subscribe({
        next: () => {
          this.snackBar.open('Отель удалён', 'OK', { duration: 4000 });
          this.loadHotels();
        },
        error: (error) =>
          this.snackBar.open(errorMessage(error, 'Не удалось удалить отель'), 'Понятно', { duration: 5000 }),
      });
    });
  }
}
