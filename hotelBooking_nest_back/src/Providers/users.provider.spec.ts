import { Test } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { UsersProvider } from "./users.provider";
import { User } from "../Models/Users";

/** Заглушка модели: возвращаем то, что нужно конкретному тесту. */
function modelStub(overrides: Record<string, unknown> = {}) {
  const chain = {
    sort: () => chain,
    skip: () => chain,
    limit: () => Promise.resolve([]),
  };
  return {
    exists: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnValue(chain),
    findById: jest.fn().mockResolvedValue(null),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

async function build(model: Record<string, unknown>) {
  const moduleRef = await Test.createTestingModule({
    providers: [UsersProvider, { provide: getModelToken(User.name), useValue: model }],
  }).compile();
  return moduleRef.get(UsersProvider);
}

describe("UsersProvider", () => {
  describe("createUser", () => {
    it("отклоняет повторную регистрацию того же адреса", async () => {
      const model = modelStub({ exists: jest.fn().mockResolvedValue({ _id: "1" }) });
      const provider = await build(model);

      await expect(
        provider.createUser({ email: "a@mail.ru", password: "12345678", name: "Анна" })
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it("приводит адрес к нижнему регистру и ставит роль client по умолчанию", async () => {
      const saved: Record<string, unknown>[] = [];
      function Model(this: any, doc: Record<string, unknown>) {
        Object.assign(this, doc, { _id: "1" });
        saved.push(doc);
        this.save = () => Promise.resolve(this);
      }
      Object.assign(Model, modelStub());
      const provider = await build(Model as never);

      await provider.createUser({ email: "  Anna@Mail.RU ", password: "12345678", name: "Анна" });

      expect(saved[0].email).toBe("anna@mail.ru");
      expect(saved[0].role).toBe("client");
      // Пароль в базу уходит только хэшем
      expect(saved[0].password).not.toBe("12345678");
    });
  });

  describe("getAllUsers", () => {
    it("экранирует спецсимволы в поиске, чтобы ввод не стал регулярным выражением", async () => {
      let captured: any;
      const chain = {
        sort: () => chain,
        skip: () => chain,
        limit: () => Promise.resolve([]),
      };
      const model = modelStub({
        find: jest.fn((q: unknown) => {
          captured = q;
          return chain;
        }),
      });
      const provider = await build(model);

      await provider.getAllUsers({ name: "(a+)+$" });

      expect(captured.name.$regex).toBe("\\(a\\+\\)\\+\\$");
    });

    it("ограничивает выборку ролью, когда область задана", async () => {
      let captured: any;
      const chain = {
        sort: () => chain,
        skip: () => chain,
        limit: () => Promise.resolve([]),
      };
      const model = modelStub({
        find: jest.fn((q: unknown) => {
          captured = q;
          return chain;
        }),
      });
      const provider = await build(model);

      await provider.getAllUsers({ role: "admin" }, "client");

      // Область важнее параметра запроса: менеджер не увидит администраторов
      expect(captured.role).toBe("client");
    });
  });

  describe("updateUser", () => {
    it("не даёт изменить собственную роль", async () => {
      const model = modelStub({
        findById: jest.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439011", email: "a@mail.ru", role: "admin" }),
      });
      const provider = await build(model);

      await expect(
        provider.updateUser("507f1f77bcf86cd799439011", { role: "client" }, "507f1f77bcf86cd799439011")
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("сообщает о ненайденной записи, а не падает", async () => {
      const provider = await build(modelStub());
      await expect(provider.updateUser("507f1f77bcf86cd799439011", { name: "Анна" }, "2")).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });
});
