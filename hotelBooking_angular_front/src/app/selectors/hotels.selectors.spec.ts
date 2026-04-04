import * as fromHotels from '../reducers/hotels.reducer';
import { selectHotelsState } from './hotels.selectors';

describe('Hotels Selectors', () => {
  it('should select the feature state', () => {
    const result = selectHotelsState({
      [fromHotels.hotelsFeatureKey]: {},
    });

    expect(result).toEqual({});
  });
});
