import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ReservationsActions } from '../../actions/reservations.actions';
import {
  selectManagerLimit, selectManagerLoading, selectManagerPageIndex,
  selectManagerReservations, selectManagerStats, selectManagerTotal,
} from '../../selectors/reservations.selectors';
import { ManagerReservationDto, MetricDto } from '../../core/api';
import { EmptyState } from '../../shared/empty-state';
import { Sparkline } from '../../shared/sparkline';
import { confirmAction } from '../../shared/confirm-dialog';
import { errorMessage } from '../../core/error-message';
import { nightWord, nightsBetween } from '../../core/date.utils';

const PAGE_SIZE = 25;

/** Производный статус брони — в модели его нет, но он однозначно следует из дат. */
type Stay = 'upcoming' | 'staying' | 'past';

interface Tile {
  key: string;
  label: string;
  value: string;
  metric: MetricDto;
  color: string;
  hero?: boolean;
  filter?: Stay;
  showDelta: boolean;
}

@Component({
  selector: 'app-manager-reservations',
  imports: [
    DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatPaginatorModule,
    MatProgressBarModule, MatSortModule, MatTableModule, MatTooltipModule, EmptyState, Sparkline,
  ],
  templateUrl: './manager-reservations.html',
  styleUrl: './manager-reservations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerReservations {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['hotel', 'room', 'guest', 'phone', 'dateStart', 'dateEnd', 'stay', 'actions'];

  private readonly rows = toSignal(this.store.select(selectManagerReservations), { initialValue: [] });
  readonly loading = toSignal(this.store.select(selectManagerLoading), { initialValue: false });
  readonly total = toSignal(this.store.select(selectManagerTotal), { initialValue: 0 });
  readonly pageIndex = toSignal(this.store.select(selectManagerPageIndex), { initialValue: 0 });
  readonly pageSize = toSignal(this.store.select(selectManagerLimit), { initialValue: PAGE_SIZE });
  readonly stats = toSignal(this.store.select(selectManagerStats), { initialValue: null });

  /** Сортировка и фильтр по статусу — состояние экрана, в сторе им делать нечего. */
  private readonly sort = signal<Sort | null>(null);
  readonly statusFilter = signal<Stay | null>(null);

  readonly stayLabel: Record<Stay, string> = {
    upcoming: 'Предстоит',
    staying: 'Проживает',
    past: 'Завершена',
  };

  constructor() {
    this.store.dispatch(ReservationsActions.loadManagerStats({ days: 30 }));
    this.load(0, PAGE_SIZE);

    this.actions$
      .pipe(ofType(ReservationsActions.deleteManagerReservationSuccess), takeUntilDestroyed())
      .subscribe(() => this.snackBar.open('Бронирование отменено', 'OK', { duration: 4000 }));

    this.actions$
      .pipe(
        ofType(
          ReservationsActions.loadManagerReservationsFailure,
          ReservationsActions.deleteManagerReservationFailure,
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ error }) =>
        this.snackBar.open(errorMessage(error, 'Не удалось выполнить действие'), 'Понятно', { duration: 5000 })
      );
  }

  /** Кнопка «Обновить»: перечитывает и таблицу, и сводку. */
  refresh(): void {
    this.load(this.pageIndex() * this.pageSize(), this.pageSize());
    this.store.dispatch(ReservationsActions.loadManagerStats({ days: 30 }));
  }

  private load(offset: number, limit: number): void {
    this.store.dispatch(ReservationsActions.loadManagerReservations({ offset, limit }));
  }

  /** Плитки дашборда: значение, динамика к прошлому периоду и ряд для спарклайна. */
  tiles(): Tile[] {
    const s = this.stats();
    if (!s) return [];
    return [
      {
        key: 'revenue', label: 'Выручка за 30 дней', hero: true, showDelta: true,
        value: this.money(s.revenue.value), metric: s.revenue, color: '--mat-sys-tertiary',
      },
      {
        key: 'bookings', label: 'Бронирований', showDelta: true,
        value: String(s.bookings.value), metric: s.bookings, color: '--mat-sys-primary',
      },
      {
        key: 'upcoming', label: 'Предстоящие заезды', filter: 'upcoming', showDelta: false,
        value: String(s.upcoming.value), metric: s.upcoming, color: '--mat-sys-primary',
      },
      {
        key: 'staying', label: 'Сейчас проживают', filter: 'staying', showDelta: false,
        value: String(s.staying.value), metric: s.staying, color: '--mat-sys-tertiary',
      },
    ];
  }

  private money(value: number): string {
    return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
  }

  toggleFilter(filter?: Stay): void {
    if (!filter) return;
    this.statusFilter.set(this.statusFilter() === filter ? null : filter);
  }

  clearFilter(): void {
    this.statusFilter.set(null);
  }

  stayOf(r: ManagerReservationDto): Stay {
    const now = Date.now();
    const start = new Date(r.dateStart).getTime();
    const end = new Date(r.dateEnd).getTime();
    if (start > now) return 'upcoming';
    if (end < now) return 'past';
    return 'staying';
  }

  /**
   * Строки страницы: сортировка и фильтр по статусу применяются поверх того,
   * что пришло из стора, и сами данные не трогают.
   */
  readonly visibleRows = computed<ManagerReservationDto[]>(() => {
    const filter = this.statusFilter();
    const rows = filter ? this.rows().filter((r) => this.stayOf(r) === filter) : this.rows();

    const sort = this.sort();
    if (!sort?.active || sort.direction === '') return rows;

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
    return [...rows].sort((a, b) => value(a).localeCompare(value(b)) * dir);
  });

  onPage(event: PageEvent): void {
    this.load(event.pageIndex * event.pageSize, event.pageSize);
  }

  nights(from: string, to: string): string {
    const n = nightsBetween(from, to);
    return `${n} ${nightWord(n)}`;
  }

  sortData(sort: Sort): void {
    this.sort.set(sort);
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
      this.store.dispatch(ReservationsActions.deleteManagerReservation({ reservationId: reservation.id }));
    });
  }
}
