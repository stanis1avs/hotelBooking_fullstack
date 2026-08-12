// Продакшен-конфигурация. Хост задаётся при сборке под конкретный стенд —
// localhost здесь означал бы неработоспособную сборку и открытый HTTP.
export const environment = {
  production: true,
  api: {
    host: 'https://api.hotelbooking.example',
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
