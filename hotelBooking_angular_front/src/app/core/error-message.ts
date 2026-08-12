import { HttpErrorResponse } from '@angular/common/http';

/**
 * Достаёт человекочитаемое сообщение из ошибки HTTP или GraphQL.
 * Раньше пользователю везде показывался один и тот же текст «Ошибка», даже когда
 * сервер присылал конкретную причину — например, «адрес уже зарегистрирован».
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;

  // Apollo складывает ошибки сервера в graphQLErrors
  const gql = (error as { graphQLErrors?: Array<{ message?: string }> }).graphQLErrors;
  if (gql?.length && gql[0].message) return gql[0].message;

  const net = (error as { networkError?: unknown }).networkError;
  if (net) return extractHttp(net) ?? fallback;

  return extractHttp(error) ?? fallback;
}

function extractHttp(error: unknown): string | null {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Сервер недоступен. Проверьте соединение';
    const body = error.error;
    const message = body?.message ?? body?.error;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    return null;
  }
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;
  return null;
}
