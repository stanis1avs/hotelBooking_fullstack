import * as fromRooms from '../reducers/rooms.reducer';
import { selectRoomsState } from './rooms.selectors';

describe('Rooms Selectors', () => {
  it('should select the feature state', () => {
    const result = selectRoomsState({
      [fromRooms.roomsFeatureKey]: {},
    });

    expect(result).toEqual({});
  });
});
