import { CookieOptions, Response } from "express";

export const REFRESH_COOKIE = "refresh_token";

/**
 * Refresh-токен живёт в httpOnly-cookie: JavaScript его не прочитает,
 * поэтому XSS не сможет выгрузить долгоживущий токен наружу (C-7 в BACKLOG.md).
 *
 * path ограничивает отправку эндпоинтами обновления и выхода — с обычными
 * запросами cookie не путешествует.
 */
export function refreshCookieOptions(isProd: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

export function setRefreshCookie(res: Response, token: string, isProd: boolean): void {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions(isProd));
}

export function clearRefreshCookie(res: Response, isProd: boolean): void {
  const { maxAge, ...opts } = refreshCookieOptions(isProd);
  res.clearCookie(REFRESH_COOKIE, opts);
}
