import { UsersActions } from '../actions/users.actions';
import { initialState, reducer } from './users.reducer';

describe('users reducer — пагинация', () => {
  it('переводит номер страницы в смещение', () => {
    const state = reducer(initialState, UsersActions.setPage({ pageIndex: 2, pageSize: 10 }));
    expect(state.searchParams.offset).toBe(20);
    expect(state.searchParams.limit).toBe(10);
  });

  it('первая страница всегда начинается с нуля', () => {
    let state = reducer(initialState, UsersActions.setPage({ pageIndex: 3, pageSize: 25 }));
    state = reducer(state, UsersActions.setPage({ pageIndex: 0, pageSize: 25 }));
    expect(state.searchParams.offset).toBe(0);
  });

  it('смена размера страницы пересчитывает смещение под новый размер', () => {
    const state = reducer(initialState, UsersActions.setPage({ pageIndex: 1, pageSize: 50 }));
    expect(state.searchParams.offset).toBe(50);
  });

  it('смена фильтра сбрасывает страницу на первую', () => {
    let state = reducer(initialState, UsersActions.setPage({ pageIndex: 2, pageSize: 10 }));
    expect(state.searchParams.offset).toBeGreaterThan(0);

    state = reducer(state, UsersActions.setSearchParams({ payload: { name: 'Иван' } }));
    expect(state.searchParams.offset).toBe(0);
    expect(state.searchParams.name).toBe('Иван');
  });

  it('clearSearchParams возвращает исходные параметры', () => {
    let state = reducer(initialState, UsersActions.setSearchParams({ payload: { name: 'Иван', role: 'admin' } }));
    state = reducer(state, UsersActions.clearSearchParams());
    expect(state.searchParams).toEqual(initialState.searchParams);
  });

  it('созданный пользователь увеличивает общее количество', () => {
    const state = reducer(
      { ...initialState, total: 7 },
      UsersActions.adminCreateUserSuccess({
        payload: { id: '1', email: 'a@mail.ru', name: 'Анна', contactPhone: '', role: 'client' },
      })
    );
    expect(state.total).toBe(8);
    expect(state.users).toHaveLength(1);
  });
});
