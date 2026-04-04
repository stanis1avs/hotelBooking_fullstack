import * as fromSupport from '../reducers/support.reducer';
import { selectSupportState } from './support.selectors';

describe('Support Selectors', () => {
  it('should select the feature state', () => {
    const result = selectSupportState({
      [fromSupport.supportFeatureKey]: {},
    });

    expect(result).toEqual({});
  });
});
