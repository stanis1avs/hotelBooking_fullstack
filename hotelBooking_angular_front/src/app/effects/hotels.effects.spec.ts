import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { HotelsEffects } from './hotels.effects';

describe('HotelsEffects', () => {
  let actions$: Observable<any>;
  let effects: HotelsEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HotelsEffects, provideMockActions(() => actions$)],
    });

    effects = TestBed.inject(HotelsEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
