import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
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

import { ApolloService } from '../../graphql/apollo.service';
import { ManagerReservationDto, ManagerStatsDto, MetricDto } from '../../core/api';
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
})
export class ManagerReservations implements OnInit {
  private readonly apollo = inject(ApolloService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly displayedColumns = ['hotel', 'room', 'guest', 'phone', 'dateStart', 'dateEnd', 'stay', 'actions'];

  reservations: ManagerReservationDto[] = [];
  loading = false;
  offset = 0;
  total = 0;
  pageSize = PAGE_SIZE;

  readonly stats = signal<ManagerStatsDto | null>(null);
  readonly statusFilter = signal<Stay | null>(null);

  readonly stayLabel: Record<Stay, string> = {
    upcoming: 'Предстоит',
    staying: 'Проживает',
    past: 'Завершена',
  };

  ngOnInit(): void {
    this.loadStats();
    this.loadReservations();
  }

  loadStats(): void {
    this.apollo.getManagerStats(30).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.cdr.markForCheck();
      },
      error: () => this.stats.set(null),
    });
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

  get visibleRows(): ManagerReservationDto[] {
    const filter = this.statusFilter();
    return filter ? this.reservations.filter((r) => this.stayOf(r) === filter) : this.reservations;
  }

  loadReservations(): void {
    this.loading = true;
    this.apollo.getManagerReservations({ offset: this.offset, limit: this.pageSize }).subscribe({
      next: (page) => {
        this.reservations = page.items;
        this.total = page.total;
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

  get pageIndex(): number {
    return Math.floor(this.offset / this.pageSize);
  }

  onPage(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.offset = event.pageIndex * event.pageSize;
    this.loadReservations();
  }

  nights(from: string, to: string): string {
    const n = nightsBetween(from, to);
    return `${n} ${nightWord(n)}`;
  }

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
          this.loadStats();
        },
        error: (error) =>
          this.snackBar.open(errorMessage(error, 'Не удалось отменить бронь'), 'Понятно', { duration: 5000 }),
      });
    });
  }
}
