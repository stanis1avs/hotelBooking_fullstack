import { createFeature, createReducer, on } from '@ngrx/store';
import { SupportActions } from '../actions/support.actions';
import { Id, SupportMessageDto, SupportRequestDto } from '../core/api';

export const supportFeatureKey = 'support';

export interface State {
  items: SupportRequestDto[];
  loading: boolean;
  error: unknown | null;
  /** Хранится идентификатор, а не сам объект: список перезагружается,
      и копия объекта разошлась бы с ним после закрытия обращения. */
  selectedId: Id | null;
  messages: SupportMessageDto[];
  messagesLoading: boolean;
}

export const initialState: State = {
  items: [],
  loading: false,
  error: null,
  selectedId: null,
  messages: [],
  messagesLoading: false,
};

export const reducer = createReducer(
  initialState,
  on(SupportActions.loadSupportRequests, (state) => ({ ...state, loading: true, error: null })),
  on(SupportActions.loadSupportRequestsSuccess, (state, { items }) => ({
    ...state,
    loading: false,
    items,
    // Выбранное обращение могло закрыться или пропасть из выдачи
    selectedId: items.some((i) => i.id === state.selectedId) ? state.selectedId : null,
  })),
  on(SupportActions.loadSupportRequestsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(SupportActions.closeSupportRequest, (state) => ({ ...state, loading: true })),
  on(SupportActions.closeSupportRequestSuccess, (state, { id }) => ({
    ...state,
    loading: false,
    items: state.items.filter((x) => x.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
    messages: state.selectedId === id ? [] : state.messages,
  })),
  on(SupportActions.closeSupportRequestFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(SupportActions.createSupportRequest, (state) => ({ ...state, loading: true })),
  // Новое обращение встаёт первым: список отсортирован от свежих к старым
  on(SupportActions.createSupportRequestSuccess, (state, { item }) => ({
    ...state,
    loading: false,
    items: [item, ...state.items],
    selectedId: item.id,
    messages: [],
  })),
  on(SupportActions.createSupportRequestFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(SupportActions.selectRequest, (state, { id }) => ({
    ...state,
    selectedId: id,
    messages: [],
    messagesLoading: true,
  })),
  on(SupportActions.loadMessagesSuccess, (state, { messages }) => ({
    ...state,
    messages,
    messagesLoading: false,
  })),
  on(SupportActions.loadMessagesFailure, (state, { error }) => ({ ...state, messagesLoading: false, error })),

  on(SupportActions.sendMessageSuccess, (state, { message }) => ({
    ...state,
    messages: [...state.messages, message],
  })),
);

export const supportFeature = createFeature({
  name: supportFeatureKey,
  reducer,
});
