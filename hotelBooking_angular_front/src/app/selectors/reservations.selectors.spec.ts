import * as fromReservations from '../reducers/reservations.reducer';
import { selectReservationsState } from './reservations.selectors';

describe('Reservations Selectors', () => {
  it('should select the feature state', () => {
    const result = selectReservationsState({
      [fromReservations.reservationsFeatureKey]: {},
    });

    expect(result).toEqual({});
  });
});
