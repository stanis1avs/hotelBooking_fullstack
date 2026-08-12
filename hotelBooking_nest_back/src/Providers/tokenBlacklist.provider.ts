import { Injectable, Logger } from "@nestjs/common";

/**
 * Хранилище отозванных refresh-токенов (по jti).
 *
 * Реализация в памяти: работает для одного инстанса и сбрасывается при рестарте.
 * Для нескольких инстансов заменить на Redis: SET revoked:{jti} 1 EX <ttl> / EXISTS revoked:{jti}.
 * См. пункт F-17 в BACKLOG.md.
 */
@Injectable()
export class TokenBlacklistProvider {
  private readonly logger = new Logger("TokenBlacklist");
  private readonly revoked = new Map<string, number>();

  constructor() {
    // Раз в час выкидываем записи, у которых истёк срок самого токена.
    const timer = setInterval(() => this.sweep(), 60 * 60 * 1000);
    timer.unref?.();
  }

  revoke(jti: string, expiresAtSec: number): void {
    if (!jti) return;
    this.revoked.set(jti, expiresAtSec * 1000);
  }

  isRevoked(jti: string): boolean {
    if (!jti) return false;
    const until = this.revoked.get(jti);
    if (until === undefined) return false;
    if (until < Date.now()) {
      this.revoked.delete(jti);
      return false;
    }
    return true;
  }

  private sweep(): void {
    const now = Date.now();
    let removed = 0;
    for (const [jti, until] of this.revoked) {
      if (until < now) {
        this.revoked.delete(jti);
        removed++;
      }
    }
    if (removed) this.logger.debug(`Очищено просроченных записей: ${removed}`);
  }
}
