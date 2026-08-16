import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, isValidObjectId } from "mongoose";
import { genSalt, hash as bcryptHash } from "bcrypt";
import { UserDocument, User } from "../Models/Users";
import { SearchUserParams, CreateUser, SendUser, UpdateUserDto } from "../Interface/Users";

/** Экранирует спецсимволы, чтобы пользовательский ввод не стал регулярным выражением (ReDoS). */
const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

@Injectable()
export class UsersProvider {
  private readonly logger = new Logger("Users");

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(createUser: CreateUser): Promise<SendUser> {
    const email = createUser.email.trim().toLowerCase();

    // Явная проверка даёт понятную ошибку; уникальный индекс в схеме страхует от гонки.
    if (await this.userModel.exists({ email })) {
      throw new ConflictException("Пользователь с таким адресом уже зарегистрирован");
    }

    const salt = await genSalt(10);
    const createdUser = new this.userModel({
      ...createUser,
      email,
      password: await bcryptHash(createUser.password, salt),
      role: createUser.role ?? "client",
    });

    try {
      await createdUser.save();
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new ConflictException("Пользователь с таким адресом уже зарегистрирован");
      }
      throw e;
    }
    return this.printFormatUser(createdUser);
  }

  /**
   * @param roleScope null — без ограничения по роли (администратор),
   *                  строка — жёсткое ограничение (менеджер видит только клиентов).
   */
  async getAllUsers(queryParams: SearchUserParams, roleScope: string | null = null): Promise<SendUser[]> {
    const query: FilterQuery<UserDocument> = {};

    if (roleScope) query.role = roleScope;
    else if (queryParams.role) query.role = queryParams.role;

    for (const field of ["name", "email", "contactPhone"] as const) {
      const value = queryParams[field];
      if (value && value.trim()) {
        query[field] = { $regex: escapeRegex(value.trim()), $options: "i" };
      }
    }

    const limit = Math.min(queryParams.limit || DEFAULT_LIMIT, MAX_LIMIT);
    const foundUsers = await this.userModel
      .find(query)
      .sort({ _id: 1 })
      .skip(queryParams.offset || 0)
      .limit(limit);

    return foundUsers.map((el) => this.printFormatUser(el));
  }

  async countUsers(queryParams: SearchUserParams, roleScope: string | null = null): Promise<number> {
    const query: FilterQuery<UserDocument> = {};
    if (roleScope) query.role = roleScope;
    else if (queryParams.role) query.role = queryParams.role;
    for (const field of ["name", "email", "contactPhone"] as const) {
      const value = queryParams[field];
      if (value && value.trim()) {
        query[field] = { $regex: escapeRegex(value.trim()), $options: "i" };
      }
    }
    return this.userModel.countDocuments(query);
  }

  /**
   * Изменение учётной записи администратором.
   *
   * @param actorId кто выполняет операцию — себе роль менять нельзя,
   *        иначе единственный администратор может случайно себя разжаловать
   *        и потерять доступ к управлению.
   */
  async updateUser(id: string, patch: UpdateUserDto, actorId: string): Promise<SendUser> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException("Пользователь не найден");
    }

    const target = await this.userModel.findById(id);
    if (!target) {
      throw new NotFoundException("Пользователь не найден");
    }

    if (patch.role && patch.role !== target.role) {
      if (String(target._id) === String(actorId)) {
        throw new ForbiddenException("Нельзя изменить собственную роль");
      }
      // Повышение прав — событие для аудита, а не рядовая правка поля
      this.logger.warn(`Роль ${target.email}: ${target.role} → ${patch.role} (изменил ${actorId})`);
    }

    const update: Record<string, unknown> = {};
    for (const field of ["name", "contactPhone", "role"] as const) {
      if (patch[field] !== undefined) update[field] = patch[field];
    }
    if (!Object.keys(update).length) {
      return this.printFormatUser(target);
    }

    const updated = await this.userModel.findByIdAndUpdate(id, update, { new: true });
    return this.printFormatUser(updated);
  }

  async getIdUser(id: string): Promise<SendUser> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException("Пользователь не найден");
    }
    const foundUser = await this.userModel.findById(id);
    if (!foundUser) {
      throw new NotFoundException("Пользователь не найден");
    }
    return this.printFormatUser(foundUser);
  }

  /** Пакетная загрузка вместо запроса на каждую запись — снимает N+1 в списках. */
  async getUsersByIds(ids: string[]): Promise<Map<string, SendUser>> {
    const unique = [...new Set(ids.map(String))].filter((id) => isValidObjectId(id));
    if (!unique.length) return new Map();
    const users = await this.userModel.find({ _id: { $in: unique } });
    return new Map(users.map((u) => [String(u._id), this.printFormatUser(u)]));
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
