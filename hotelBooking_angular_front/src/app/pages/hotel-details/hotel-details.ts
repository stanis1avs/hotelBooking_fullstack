import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, map } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Actions, ofType } from '@ngrx/effects';

import { RoomsActions } from '../../actions/rooms.actions';
import { selectRoomsError, selectRoomsItems, selectRoomsLoading } from '../../selectors/rooms.selectors';
import { selectAuthUser } from '../../selectors/auth.selectors';
import { ReservationsActions } from '../../actions/reservations.actions';
import { EmptyState } from '../../shared/empty-state';
import { ImageUrlPipe } from '../../shared/image-url.pipe';
import { MoneyPipe } from '../../shared/money.pipe';
import { AMENITY_META } from '../../shared/amenities';
import { ApolloService } from '../../graphql/apollo.service';
import { HotelDto, RoomDto } from '../../core/api';
import { addDays, nightWord, nightsBetween, toLocalIsoDate } from '../../core/date.utils';

@Component({
  selector: 'app-hotel-details',
  imports: [
    AsyncPipe, DatePipe, RouterLink, ReactiveFormsModule, MoneyPipe,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, EmptyState, ImageUrlPipe,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './hotel-details.html',
  styleUrl: './hotel-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotelDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly apollo = inject(ApolloService);
  private readonly actions$ = inject(Actions);
  private readonly snackBar = inject(MatSnackBar);
  /**
   * takeUntilDestroyed без аргумента требует контекста внедрения зависимостей,
   * которого в ngOnInit нет. Из-за исключения не создавалась подписка на
   * параметры маршрута: карточка отеля не запрашивалась, номера не грузились,
   * и страница показывала «свободных номеров нет».
   */
  private readonly destroyRef = inject(DestroyRef);

  readonly rooms$ = this.store.select(selectRoomsItems);
  readonly loading$ = this.store.select(selectRoomsLoading);
  /** Ошибка загрузки и пустой результат — разные состояния: раньше при
      недоступном сервере интерфейс сообщал «свободных номеров нет». */
  readonly roomsError$ = this.store.select(selectRoomsError);
  readonly isClient$ = this.store.select(selectAuthUser).pipe(map((u) => u?.role === 'client'));

  readonly hotel = signal<HotelDto | null>(null);
  readonly minDate = new Date();
  readonly amenity = AMENITY_META;

  /** Мастер бронирования: даты → номер → подтверждение. */
  readonly step = signal(0);
  readonly selectedRoom = signal<RoomDto | null>(null);
  readonly steps = ['Даты', 'Номер', 'Подтверждение'];

  readonly range = new FormGroup({
    start: new FormControl<Date | null>(new Date(), Validators.required),
    end: new FormControl<Date | null>(new Date(Date.now() + 2 * 86_400_000), Validators.required),
  });

  readonly nightsCount = signal(2);
  readonly total = computed(() => {
    const room = this.selectedRoom();
    return room ? room.price * this.nightsCount() : 0;
  });

  private hotelId: string | null = null;

  /** Ошибка запроса карточки отеля — без неё шапка молча не отрисовывалась. */
  readonly hotelError = signal(false);

  reload(): void {
    if (!this.hotelId) return;
    this.hotelError.set(false);
    this.store.dispatch(RoomsActions.loadRooms({ hotelId: this.hotelId }));
    this.apollo.getHotel(this.hotelId).subscribe({
      next: (h) => this.hotel.set(h),
      error: () => {
        this.hotel.set(null);
        this.hotelError.set(true);
      },
    });
  }

  readonly guest = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    note: new FormControl<string>('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((p) => p.get('hotelId')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((hotelId) => {
        if (!hotelId) return;
        this.hotelId = hotelId;
        this.reload();
      });

    this.store
      .select(selectAuthUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (!user) return;
        this.guest.patchValue({ name: user.name, email: user.email, phone: user.contactPhone ?? '' });
      });

    this.range.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.recalcNights());

    // Успешное бронирование закрывает мастер — уход на «Мои брони» делает эффект
    this.actions$
      .pipe(ofType(ReservationsActions.createReservationSuccess), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.step.set(0);
        this.selectedRoom.set(null);
      });

    this.recalcNights();
  }

  private recalcNights(): void {
    const { start, end } = this.range.value;
    if (start && end) this.nightsCount.set(nightsBetween(toLocalIsoDate(start), toLocalIsoDate(end)));
  }

  nightsLabel(): string {
    const n = this.nightsCount();
    return `${n} ${nightWord(n)}`;
  }

  stars(n: number): number[] {
    return Array.from({ length: Math.max(0, Math.min(5, n)) });
  }

  goToStep(index: number): void {
    if (index === 2 && !this.selectedRoom()) return;
    this.step.set(index);
  }

  pickRoom(room: RoomDto): void {
    if (this.selectedRoom()?.id === room.id) {
      this.step.set(2);
      return;
    }
    this.selectedRoom.set(room);
  }

  confirm(): void {
    const room = this.selectedRoom();
    if (!room) return;
    if (this.guest.invalid) {
      this.guest.markAllAsTouched();
      this.snackBar.open('Проверьте данные гостя', 'Понятно', { duration: 4000 });
      return;
    }

    const start = this.range.controls.start.value!;
    const end = this.range.controls.end.value!;
    const dateStart = toLocalIsoDate(start);
    const dateEnd = toLocalIsoDate(end) === dateStart ? addDays(1, start) : toLocalIsoDate(end);

    this.store.dispatch(
      ReservationsActions.createReservation({ payload: { roomId: room.id, dateStart, dateEnd } })
    );
  }
}
