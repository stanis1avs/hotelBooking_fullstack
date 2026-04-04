import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';

import { SupportEffects } from './support.effects';

describe('SupportEffects', () => {
  let actions$: Observable<any>;
  let effects: SupportEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupportEffects, provideMockActions(() => actions$)],
    });

    effects = TestBed.inject(SupportEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });
});
