export const environment = {
  production: false,
  api: {
    host: 'http://localhost:7000',
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
