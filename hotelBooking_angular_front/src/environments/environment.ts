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
    endpoints: {
      getRooms: '/api/common/hotel-rooms',
      getHotels: '/api/common/hotels',
      editRooms: '/api/admin/hotel-rooms/',
      editHotels: '/api/admin/hotels/',
      reservationsIn: '/api/client/reservations',
      reservationsOut: '/api/client/reservations',
      authLogin: '/api/auth/login',
      authLogout: '/api/auth/logout',
      authRefresh: '/api/auth/refresh',
      register: '/api/client/register',
      support: '/api/client/support-requests/',
    },
  },
};
