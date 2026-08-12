import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApolloService } from '../../graphql/apollo.service';
import { ManagerReservationDto } from '../../core/api';
import { EmptyState } from '../../shared/empty-state';
import { confirmAction } from '../../shared/confirm-dialog';
import { errorMessage } from '../../core/error-message';
import { nightWord, nightsBetween } from '../../core/date.utils';

const PAGE_SIZE = 25;

@Component({
  selector: 'app-manager-reservations',
  imports: [
    DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatSortModule, MatTableModule, MatTooltipModule, EmptyState,
  ],
  templateUrl: './manager-reservations.html',
  styleUrl: './manager-reservations.scss',
})
export class ManagerReservations implements OnInit {
  private readonly apollo = inject(ApolloService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly displayedColumns = ['hotel', 'room', 'guest', 'phone', 'dateStart', 'dateEnd', 'nights', 'actions'];

  reservations: ManagerReservationDto[] = [];
  loading = false;
  offset = 0;
  readonly pageSize = PAGE_SIZE;

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.apollo.getManagerReservations({ offset: this.offset }).subscribe({
      next: (items) => {
        this.reservations = items;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.cdr.markForCheck();
        this.snackBar.open(errorMessage(error, 'Не удалось загрузить бронирования'), 'Понятно', { duration: 5000 });
      },
    });
  }

  get hasPrev(): boolean {
    return this.offset > 0;
  }

  get hasNext(): boolean {
    return this.reservations.length === this.pageSize;
  }

  nextPage(): void {
    this.offset += this.pageSize;
    this.loadReservations();
  }

  prevPage(): void {
    this.offset = Math.max(0, this.offset - this.pageSize);
    this.loadReservations();
  }

  nights(from: string, to: string): string {
    const n = nightsBetween(from, to);
    return `${n} ${nightWord(n)}`;
  }

  /** Сортировка на клиенте по текущей странице — раньше её не было вовсе. */
  sortData(sort: Sort): void {
    if (!sort.active || sort.direction === '') return;
    const dir = sort.direction === 'asc' ? 1 : -1;
    const value = (r: ManagerReservationDto): string => {
      switch (sort.active) {
        case 'hotel': return r.hotel.title;
        case 'room': return r.room.description;
        case 'guest': return r.user?.name ?? '';
        case 'dateStart': return r.dateStart;
        case 'dateEnd': return r.dateEnd;
        default: return '';
      }
    };
    this.reservations = [...this.reservations].sort((a, b) => value(a).localeCompare(value(b)) * dir);
  }

  delete(reservation: ManagerReservationDto): void {
    confirmAction(this.dialog, {
      title: 'Отменить бронирование?',
      message: `Бронь гостя «${reservation.user?.name ?? 'без имени'}» в «${reservation.hotel.title}» будет отменена, номер вернётся в продажу.`,
      confirmLabel: 'Отменить бронь',
      cancelLabel: 'Оставить',
      destructive: true,
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.apollo.deleteManagerReservation(reservation.id).subscribe({
        next: () => {
          this.snackBar.open('Бронирование отменено', 'OK', { duration: 4000 });
          this.loadReservations();
        },
        error: (error) =>
          this.snackBar.open(errorMessage(error, 'Не удалось отменить бронь'), 'Понятно', { duration: 5000 }),
      });
    });
  }
}
