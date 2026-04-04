import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { ReservationsEffects } from './reservations.effects';

describe('ReservationsEffects', () => {
  let actions$: Observable<any>;
  let effects: ReservationsEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReservationsEffects, provideMockActions(() => actions$)],
    });

    effects = TestBed.inject(ReservationsEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
