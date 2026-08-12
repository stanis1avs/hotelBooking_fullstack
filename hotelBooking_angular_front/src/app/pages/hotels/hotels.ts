import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
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
import { addDays, nightWord, nightsBetween, plural, toLocalIsoDate } from '../../core/date.utils';

@Component({
  selector: 'app-hotels',
  imports: [
    AsyncPipe, ReactiveFormsModule, RouterLink,
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

  readonly termControl = new FormControl<string>('', { nonNullable: true });

  /**
   * Диапазон дат через MatDatepicker вместо двух нативных input[type=date]:
   * единый вид во всех браузерах и возможность запретить выбор прошедших дат.
   */
  readonly range = new FormGroup({
    start: new FormControl<Date | null>(new Date(), Validators.required),
    end: new FormControl<Date | null>(new Date(Date.now() + 86_400_000), Validators.required),
  });

  readonly nightsLabel$ = this.range.valueChanges.pipe(
    startWith(this.range.value),
    map(({ start, end }) => {
      if (!start || !end) return '';
      const n = nightsBetween(toLocalIsoDate(start), toLocalIsoDate(end));
      return `${n} ${nightWord(n)}`;
    })
  );

  readonly countLabel = (n: number) => `${n} ${plural(n, 'отель', 'отеля', 'отелей')}`;

  ngOnInit(): void {
    // Инициализация перенесена из конструктора: раньше здесь стоял
    // setTimeout(..., 0), чтобы обойти порядок инициализации компонента.
    this.store
      .select(selectHotelsTerm)
      .pipe(takeUntilDestroyed())
      .subscribe((term) => this.termControl.setValue(term, { emitEvent: false }));

    combineLatest([
      this.store.select(selectHotelsDateArrival),
      this.store.select(selectHotelsDateDeparture),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([from, to]) => {
        if (from) this.range.controls.start.setValue(new Date(from), { emitEvent: false });
        if (to) this.range.controls.end.setValue(new Date(to), { emitEvent: false });
      });

    // Поиск с задержкой — раньше строка поиска только писалась в стор,
    // а запрос уходил исключительно по кнопке.
    this.termControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.search());

    this.range.valueChanges
      .pipe(debounceTime(150), takeUntilDestroyed())
      .subscribe(() => {
        if (this.range.valid) this.search();
      });

    this.search();
  }

  search(): void {
    const start = this.range.controls.start.value;
    const end = this.range.controls.end.value;
    if (!start || !end) return;

    const dateArrival = toLocalIsoDate(start);
    const dateDeparture = toLocalIsoDate(end) === dateArrival ? addDays(1, start) : toLocalIsoDate(end);

    this.store.dispatch(HotelsActions.setSearchTerm({ term: this.termControl.value }));
    this.store.dispatch(HotelsActions.setDates({ dateArrival, dateDeparture }));
    this.store.dispatch(
      HotelsActions.loadHotels({
        params: { offset: 0, hotel: this.termControl.value.trim() || undefined, dateArrival, dateDeparture },
      })
    );
  }

  resetSearch(): void {
    this.termControl.setValue('');
  }
}
