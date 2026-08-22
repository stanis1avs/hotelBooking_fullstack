import { Test } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { TokenBlacklistProvider } from "./tokenBlacklist.provider";
import { RevokedToken } from "../Models/RevokedTokens";

function build(model: Record<string, unknown>) {
  return Test.createTestingModule({
    providers: [TokenBlacklistProvider, { provide: getModelToken(RevokedToken.name), useValue: model }],
  })
    .compile()
    .then((m) => m.get(TokenBlacklistProvider));
}

describe("TokenBlacklistProvider", () => {
  it("сохраняет отзыв с моментом истечения самого токена", async () => {
    const updateOne = jest.fn().mockResolvedValue({});
    const provider = await build({ updateOne, exists: jest.fn() });

    const expiresAtSec = 1893456000;
    await provider.revoke("jti-1", expiresAtSec);

    const [filter, update, options] = updateOne.mock.calls[0];
    expect(filter).toEqual({ jti: "jti-1" });
    expect(update.$set.expiresAt).toEqual(new Date(expiresAtSec * 1000));
    // upsert: повторный выход тем же токеном не должен падать на уникальном индексе
    expect(options).toEqual({ upsert: true });
  });

  it("считает токен отозванным, если запись найдена", async () => {
    const provider = await build({ exists: jest.fn().mockResolvedValue({ _id: "x" }), updateOne: jest.fn() });
    expect(await provider.isRevoked("jti-1")).toBe(true);
  });

  it("не считает отозванным, когда записи нет", async () => {
    const provider = await build({ exists: jest.fn().mockResolvedValue(null), updateOne: jest.fn() });
    expect(await provider.isRevoked("jti-1")).toBe(false);
  });

  it("сбой базы не роняет выход из аккаунта", async () => {
    // Cookie всё равно очищается, и оставить пользователя с ошибкой при выходе хуже,
    // чем не записать отзыв: сам токен всё равно перестанет приниматься по TTL.
    const provider = await build({
      updateOne: jest.fn().mockRejectedValue(new Error("нет соединения")),
      exists: jest.fn(),
    });

    await expect(provider.revoke("jti-1", 1893456000)).resolves.toBeUndefined();
  });

  it("пустой jti игнорируется", async () => {
    const updateOne = jest.fn();
    const provider = await build({ updateOne, exists: jest.fn() });

    await provider.revoke("", 1893456000);

    expect(updateOne).not.toHaveBeenCalled();
    expect(await provider.isRevoked("")).toBe(false);
  });
});
