export const environment = {
  production: false,
  api: {
    host: 'http://localhost:7000',
    // Остались только адреса, которые нельзя увести в GraphQL:
    // обновление токена вызывает HTTP-интерцептор, выход работает с cookie.
    endpoints: {
      authLogout: '/api/auth/logout',
      authRefresh: '/api/auth/refresh',
    },
  },
};
