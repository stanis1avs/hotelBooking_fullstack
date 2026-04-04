import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, startWith } from 'rxjs';
import { HotelsActions } from '../../actions/hotels.actions';
import {
  selectHotelsDateArrival,
  selectHotelsDateDeparture,
  selectHotelsItems,
  selectHotelsLoading,
  selectHotelsTerm,
} from '../../selectors/hotels.selectors';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-hotels',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './hotels.html',
})
export class Hotels {
  readonly termControl = new FormControl<string>('', { nonNullable: true });
  readonly dateArrivalControl = new FormControl<string>('', { nonNullable: true });
  readonly dateDepartureControl = new FormControl<string>('', { nonNullable: true });

  readonly items$;
  readonly loading$;

  constructor(private readonly store: Store) {
    this.items$ = this.store.select(selectHotelsItems);
    this.loading$ = this.store.select(selectHotelsLoading);

    this.store.select(selectHotelsTerm).subscribe((term) => this.termControl.setValue(term, { emitEvent: false }));
    this.store
      .select(selectHotelsDateArrival)
      .subscribe((d) => this.dateArrivalControl.setValue(d, { emitEvent: false }));
    this.store
      .select(selectHotelsDateDeparture)
      .subscribe((d) => this.dateDepartureControl.setValue(d, { emitEvent: false }));

    this.termControl.valueChanges.subscribe((term) => this.store.dispatch(HotelsActions.setSearchTerm({ term })));
    combineLatest([
      this.dateArrivalControl.valueChanges.pipe(startWith(this.dateArrivalControl.value)),
      this.dateDepartureControl.valueChanges.pipe(startWith(this.dateDepartureControl.value)),
    ]).subscribe(([dateArrival, dateDeparture]) => {
      if (!dateArrival || !dateDeparture) {
        return;
      }
      this.store.dispatch(HotelsActions.setDates({ dateArrival, dateDeparture }));
    });

    // Устанавливаем даты по умолчанию и загружаем отели
    setTimeout(() => this.setDefaultDatesAndLoad(), 0);
  }

  setDefaultDatesAndLoad() {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const dateArrival = today.toISOString().slice(0, 10);
    const dateDeparture = tomorrow.toISOString().slice(0, 10);
    
    this.dateArrivalControl.setValue(dateArrival);
    this.dateDepartureControl.setValue(dateDeparture);
    
    this.store.dispatch(
      HotelsActions.loadHotels({
        params: {
          offset: 0,
          dateArrival,
          dateDeparture,
        },
      })
    );
  }

  reload() {
    const term = this.termControl.value || '';
    const dateArrival = this.dateArrivalControl.value;
    const dateDeparture = this.dateDepartureControl.value;

    if (!dateArrival || !dateDeparture) {
      return;
    }

    this.store.dispatch(
      HotelsActions.loadHotels({
        params: {
          offset: 0,
          hotel: term,
          dateArrival,
          dateDeparture,
        },
      })
    );
  }
}
