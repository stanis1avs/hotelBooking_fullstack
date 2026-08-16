import { CookieOptions, Request, Response } from "express";

export const REFRESH_COOKIE = "refresh_token";

/**
 * Флаг Secure выставляется по фактическому протоколу запроса, а не по NODE_ENV.
 *
 * Привязка к NODE_ENV ломала локальный запуск в Docker: приложение работает
 * по http://localhost, а Secure-cookie строгие клиенты по HTTP не отправляют,
 * из-за чего обновление токена возвращало 401. Заголовок X-Forwarded-Proto
 * проставляет nginx, поэтому за HTTPS-прокси флаг всё равно включится.
 */
export function isSecureRequest(req: Request): boolean {
  return req.secure || req.headers["x-forwarded-proto"] === "https";
}

/**
 * Refresh-токен живёт в httpOnly-cookie: JavaScript его не прочитает,
 * поэтому XSS не сможет выгрузить долгоживущий токен наружу (C-7 в BACKLOG.md).
 *
 * path ограничивает отправку эндпоинтами обновления и выхода — с обычными
 * запросами cookie не путешествует.
 */
export function refreshCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

export function setRefreshCookie(res: Response, token: string, req: Request): void {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions(isSecureRequest(req)));
}

export function clearRefreshCookie(res: Response, req: Request): void {
  const { maxAge, ...opts } = refreshCookieOptions(isSecureRequest(req));
  res.clearCookie(REFRESH_COOKIE, opts);
}
