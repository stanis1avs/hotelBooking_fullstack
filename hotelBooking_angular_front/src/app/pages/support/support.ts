import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { SupportActions } from '../../actions/support.actions';
import { selectSupportItems, selectSupportLoading } from '../../selectors/support.selectors';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-support',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './support.html',
})
export class Support {
  readonly items$: Observable<unknown[]>;
  readonly loading$: Observable<boolean>;

  constructor(private readonly store: Store) {
    this.items$ = this.store.select(selectSupportItems);
    this.loading$ = this.store.select(selectSupportLoading);
    this.store.dispatch(SupportActions.loadSupportRequests());
  }

  reload() {
    this.store.dispatch(SupportActions.loadSupportRequests());
  }
}
