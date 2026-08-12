import { UsersActions } from '../actions/users.actions';
import { initialState, reducer } from './users.reducer';

describe('users reducer — пагинация', () => {
  it('nextPage сдвигает offset ровно на размер страницы', () => {
    const state = reducer(initialState, UsersActions.nextPage());
    expect(state.searchParams.offset).toBe(initialState.searchParams.limit);
  });

  it('повторный nextPage продолжает сдвиг, а не пересчитывает с нуля', () => {
    let state = reducer(initialState, UsersActions.nextPage());
    state = reducer(state, UsersActions.nextPage());
    expect(state.searchParams.offset).toBe(initialState.searchParams.limit * 2);
  });

  it('prevPage не уходит в отрицательный offset', () => {
    const state = reducer(initialState, UsersActions.prevPage());
    expect(state.searchParams.offset).toBe(0);
  });

  it('смена фильтра сбрасывает страницу на первую', () => {
    let state = reducer(initialState, UsersActions.nextPage());
    expect(state.searchParams.offset).toBeGreaterThan(0);

    state = reducer(state, UsersActions.setSearchParams({ payload: { name: 'Иван' } }));
    expect(state.searchParams.offset).toBe(0);
    expect(state.searchParams.name).toBe('Иван');
  });

  it('смена размера страницы сбрасывает offset', () => {
    let state = reducer(initialState, UsersActions.nextPage());
    state = reducer(state, UsersActions.setPageSize({ limit: 50 }));
    expect(state.searchParams.limit).toBe(50);
    expect(state.searchParams.offset).toBe(0);
  });

  it('clearSearchParams возвращает исходные параметры', () => {
    let state = reducer(initialState, UsersActions.setSearchParams({ payload: { name: 'Иван', role: 'admin' } }));
    state = reducer(state, UsersActions.clearSearchParams());
    expect(state.searchParams).toEqual(initialState.searchParams);
  });
});
