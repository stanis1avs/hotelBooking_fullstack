import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcrypt";
import { randomUUID } from "crypto";
import { UserDocument, User } from "../Models/Users";
import { SendUser, UserToJWTPayload, ValidatedToken } from "../Interface/Users";
import { ConfigService } from "@nestjs/config";
import { TokenBlacklistProvider } from "./tokenBlacklist.provider";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  userData: SendUser;
}

@Injectable()
export class AuthProvider {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private blacklist: TokenBlacklistProvider
  ) {}

  private get accessSecret(): string {
    return this.configService.get<string>("JWT_TOKEN_SECRET");
  }

  /**
   * Refresh подписывается ОТДЕЛЬНЫМ секретом, иначе его можно предъявить
   * как access-токен — короткий срок жизни access перестаёт что-либо значить.
   */
  private get refreshSecret(): string {
    return this.configService.get<string>("JWT_REFRESH_SECRET") ?? this.accessSecret;
  }

  async validateUser(email: string, pass: string): Promise<SendUser | null> {
    const user = await this.userModel.findOne({ email: email.trim().toLowerCase() });
    // Пароль сверяем всегда, даже если пользователя нет: иначе разница во времени
    // ответа выдаёт, какие адреса зарегистрированы.
    const hash = user?.password ?? "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
    const ok = await compare(pass, hash);
    return user && ok ? this.printFormatUser(user) : null;
  }

  async issueTokens(userData: SendUser): Promise<TokenPair> {
    const base = { sub: String(userData.id), email: userData.email, role: userData.role };

    const access_token = this.jwtService.sign(
      { ...base, type: "access" },
      { secret: this.accessSecret, expiresIn: this.configService.get("JWT_ACCESS_TTL") ?? "15m" }
    );

    const refresh_token = this.jwtService.sign(
      { ...base, type: "refresh", jti: randomUUID() },
      { secret: this.refreshSecret, expiresIn: this.configService.get("JWT_REFRESH_TTL") ?? "30d" }
    );

    return { access_token, refresh_token, userData };
  }

  /** Совместимость со старым вызовом login(user) — отдаёт только access. */
  async login(userData: SendUser): Promise<ValidatedToken> {
    const { access_token } = await this.issueTokens(userData);
    return { token: access_token, userData };
  }

  /**
   * Обмен refresh на новую пару. Старый refresh отзывается сразу (ротация):
   * повторное использование украденного токена не сработает.
   */
  async refresh(payload: UserToJWTPayload & { jti?: string; exp?: number }): Promise<TokenPair> {
    const user = await this.userModel.findById(payload.id);
    if (!user) {
      throw new UnauthorizedException("Пользователь не найден");
    }
    if (payload.jti) {
      this.blacklist.revoke(payload.jti, payload.exp ?? Math.floor(Date.now() / 1000) + 2592000);
    }
    return this.issueTokens(this.printFormatUser(user));
  }

  /** Разбирает refresh-токен вне Passport — нужно для GraphQL-мутации. */
  verifyRefresh(token: string): UserToJWTPayload & { jti?: string; exp?: number } {
    let decoded: Record<string, unknown>;
    try {
      decoded = this.jwtService.verify(token, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException("Refresh-токен недействителен или истёк");
    }
    if (decoded.type !== "refresh") {
      throw new UnauthorizedException("Ожидался refresh-токен");
    }
    if (decoded.jti && this.blacklist.isRevoked(String(decoded.jti))) {
      throw new UnauthorizedException("Refresh-токен отозван");
    }
    return {
      id: String(decoded.sub),
      email: String(decoded.email),
      role: String(decoded.role),
      jti: decoded.jti ? String(decoded.jti) : undefined,
      exp: typeof decoded.exp === "number" ? decoded.exp : undefined,
    };
  }

  /** Выход: отзываем refresh, чтобы он не работал до конца TTL. */
  revokeRefresh(token: string | undefined): void {
    if (!token) return;
    try {
      const decoded: any = this.jwtService.verify(token, { secret: this.refreshSecret });
      if (decoded?.jti) this.blacklist.revoke(decoded.jti, decoded.exp);
    } catch {
      // Просроченный или битый токен отзывать не нужно
    }
  }

  printFormatUser(user: UserDocument): SendUser {
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      contactPhone: user.contactPhone,
      role: user.role,
    };
  }
}
