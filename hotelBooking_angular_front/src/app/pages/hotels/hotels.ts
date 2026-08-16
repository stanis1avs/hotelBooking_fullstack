import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, debounceTime, distinctUntilChanged } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { HotelsActions } from '../../actions/hotels.actions';
import {
  selectHotelsDateArrival, selectHotelsDateDeparture,
  selectHotelsItems, selectHotelsLoading, selectHotelsTerm,
} from '../../selectors/hotels.selectors';
import { EmptyState } from '../../shared/empty-state';
import { MoneyPipe } from '../../shared/money.pipe';
import { AMENITY_META } from '../../shared/amenities';
import { addDays, nightWord, nightsBetween, plural, toLocalIsoDate } from '../../core/date.utils';

interface Preset {
  label: string;
  icon: string;
  term: string;
  nights: number;
}

@Component({
  selector: 'app-hotels',
  imports: [
    AsyncPipe, ReactiveFormsModule, RouterLink, MoneyPipe,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatDatepickerModule, MatProgressBarModule, EmptyState,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './hotels.html',
  styleUrl: './hotels.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hotels implements OnInit {
  private readonly store = inject(Store);

  readonly items$ = this.store.select(selectHotelsItems);
  readonly loading$ = this.store.select(selectHotelsLoading);

  readonly minDate = new Date();
  readonly amenity = AMENITY_META;

  /**
   * Одна форма на весь поиск.
   *
   * Раньше поле дат жило в отдельной FormGroup, вложенной директивой
   * formGroup внутрь другой такой же — Angular не разбирал такую вложенность,
   * и поле диапазона рендерилось без подписи и рамки.
   */
  readonly form = new FormGroup({
    term: new FormControl<string>('', { nonNullable: true }),
    start: new FormControl<Date | null>(new Date(), Validators.required),
    end: new FormControl<Date | null>(new Date(Date.now() + 86_400_000), Validators.required),
  });

  /** Подборки подставляют параметры поиска, а не просто украшают герой. */
  readonly presets: Preset[] = [
    { label: 'К морю', icon: 'beach_access', term: 'Сочи', nights: 7 },
    { label: 'На выходные', icon: 'weekend', term: '', nights: 2 },
    { label: 'В горы', icon: 'landscape', term: 'Карелия', nights: 4 },
    { label: 'Командировка', icon: 'work', term: 'Москва', nights: 3 },
  ];

  private readonly nightsCount = signal(1);

  ngOnInit(): void {
    this.store
      .select(selectHotelsTerm)
      .pipe(takeUntilDestroyed())
      .subscribe((term) => this.form.controls.term.setValue(term, { emitEvent: false }));

    combineLatest([
      this.store.select(selectHotelsDateArrival),
      this.store.select(selectHotelsDateDeparture),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([from, to]) => {
        if (from) this.form.controls.start.setValue(new Date(from), { emitEvent: false });
        if (to) this.form.controls.end.setValue(new Date(to), { emitEvent: false });
        this.recalcNights();
      });

    // Поиск с задержкой: раньше строка только писалась в стор,
    // а запрос уходил исключительно по кнопке.
    this.form.controls.term.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.search());

    combineLatest([
      this.form.controls.start.valueChanges,
      this.form.controls.end.valueChanges,
    ])
      .pipe(debounceTime(150), takeUntilDestroyed())
      .subscribe(() => {
        this.recalcNights();
        if (this.form.controls.start.valid && this.form.controls.end.valid) this.search();
      });

    this.search();
  }

  private recalcNights(): void {
    const start = this.form.controls.start.value;
    const end = this.form.controls.end.value;
    if (start && end) this.nightsCount.set(nightsBetween(toLocalIsoDate(start), toLocalIsoDate(end)));
  }

  nights(): number {
    return this.nightsCount();
  }

  nightsLabel(): string {
    const n = this.nightsCount();
    return `${n} ${nightWord(n)}`;
  }

  countLabel(n: number): string {
    return `${n} ${plural(n, 'отель', 'отеля', 'отелей')}`;
  }

  reviewsLabel(n: number): string {
    return `${n} ${plural(n, 'отзыв', 'отзыва', 'отзывов')}`;
  }

  stars(n: number): number[] {
    return Array.from({ length: Math.max(0, Math.min(5, n)) });
  }

  applyPreset(preset: Preset): void {
    const start = new Date();
    this.form.patchValue(
      { term: preset.term, start, end: new Date(Date.now() + preset.nights * 86_400_000) },
      { emitEvent: false }
    );
    this.recalcNights();
    this.search();
  }

  search(): void {
    const start = this.form.controls.start.value;
    const end = this.form.controls.end.value;
    if (!start || !end) return;

    const dateArrival = toLocalIsoDate(start);
    const dateDeparture = toLocalIsoDate(end) === dateArrival ? addDays(1, start) : toLocalIsoDate(end);
    const term = this.form.controls.term.value;

    this.store.dispatch(HotelsActions.setSearchTerm({ term }));
    this.store.dispatch(HotelsActions.setDates({ dateArrival, dateDeparture }));
    this.store.dispatch(
      HotelsActions.loadHotels({
        params: { offset: 0, limit: 24, hotel: term.trim() || undefined, dateArrival, dateDeparture },
      })
    );
  }

  resetSearch(): void {
    this.form.controls.term.setValue('');
  }
}
