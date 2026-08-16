import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { HotelsActions } from '../../actions/hotels.actions';
import {
  selectHotelsDateArrival, selectHotelsDateDeparture, selectHotelsError, selectHotelsItems,
  selectHotelsLoading, selectHotelsPageIndex, selectHotelsTerm, selectHotelsTotal,
} from '../../selectors/hotels.selectors';
import { EmptyState } from '../../shared/empty-state';
import { ImageUrlPipe } from '../../shared/image-url.pipe';
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
    MatIconModule, MatDatepickerModule, MatPaginatorModule, MatProgressBarModule,
    EmptyState, ImageUrlPipe,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './hotels.html',
  styleUrl: './hotels.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hotels implements OnInit {
  private readonly store = inject(Store);
  /**
   * takeUntilDestroyed без аргумента работает только в контексте внедрения
   * зависимостей — то есть в конструкторе или инициализаторе поля.
   * В ngOnInit его нет, и вызов бросал исключение: подписки не создавались,
   * поиск не запускался, страница оставалась пустой.
   */
  private readonly destroyRef = inject(DestroyRef);

  readonly items$ = this.store.select(selectHotelsItems);
  readonly total$ = this.store.select(selectHotelsTotal);
  readonly pageIndex$ = this.store.select(selectHotelsPageIndex);
  readonly loading$ = this.store.select(selectHotelsLoading);
  /** Ошибка запроса и пустая выдача — разные состояния */
  readonly error$ = this.store.select(selectHotelsError);

  /** Двенадцать карточек — три полных ряда на широком экране. */
  pageSize = 12;

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

  /** Выбранная подборка. Раньше кнопки фильтровали выдачу,
      но никак не показывали, какая из них сейчас применена. */
  readonly activePreset = signal<string | null>(null);

  /** Размер каталога для заголовка — берётся из выдачи без фильтра,
      иначе число в шапке менялось бы на каждый ввод в поиске. */
  private readonly catalogSize = signal<number | null>(null);

  catalogLabel(): string {
    const n = this.catalogSize();
    return n === null ? 'Отели по всей стране' : `${n} ${plural(n, 'отель', 'отеля', 'отелей')}`;
  }

  ngOnInit(): void {
    this.store
      .select(selectHotelsTerm)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => this.form.controls.term.setValue(term, { emitEvent: false }));

    combineLatest([
      this.store.select(selectHotelsDateArrival),
      this.store.select(selectHotelsDateDeparture),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([from, to]) => {
        if (from) this.form.controls.start.setValue(new Date(from), { emitEvent: false });
        if (to) this.form.controls.end.setValue(new Date(to), { emitEvent: false });
        this.recalcNights();
      });

    combineLatest([this.total$, this.store.select(selectHotelsTerm)])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([total, term]) => {
        if (!term.trim()) this.catalogSize.set(total);
      });

    // Поиск с задержкой: раньше строка только писалась в стор,
    // а запрос уходил исключительно по кнопке.
    // Ручная правка запроса или дат снимает выделение с подборки:
    // подборка задаёт обе величины сразу, и после изменения любой из них
    // подсветка перестала бы соответствовать выдаче.
    this.form.controls.term.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.activePreset.set(null);
        this.search();
      });

    combineLatest([
      this.form.controls.start.valueChanges,
      this.form.controls.end.valueChanges,
    ])
      .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.recalcNights();
        this.activePreset.set(null);
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
    this.activePreset.set(preset.label);
    this.search();
  }

  /** Новый поиск всегда открывается с первой страницы. */
  search(): void {
    this.load(0, this.pageSize);
  }

  onPage(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.load(event.pageIndex * event.pageSize, event.pageSize);
  }

  private load(offset: number, limit: number): void {
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
        params: { offset, limit, hotel: term.trim() || undefined, dateArrival, dateDeparture },
      })
    );
  }

  resetSearch(): void {
    this.activePreset.set(null);
    this.form.controls.term.setValue('');
  }
}
