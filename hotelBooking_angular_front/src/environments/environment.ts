/**
 * Продакшен-конфигурация.
 *
 * host пустой — запросы уходят на тот же origin, что и страница,
 * а nginx проксирует /api и /graphql на контейнер бэкенда.
 * Раньше здесь стоял localhost, из-за чего прод-сборка была неработоспособна.
 */
export const environment = {
  production: true,
  api: {
    host: '',
    // Остались только адреса, которые нельзя увести в GraphQL:
    // обновление токена вызывает HTTP-интерцептор, выход работает с cookie.
    endpoints: {
      authLogout: '/api/auth/logout',
      authRefresh: '/api/auth/refresh',
    },
  },
};
