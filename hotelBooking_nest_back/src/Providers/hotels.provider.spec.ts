import { Test } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { HotelsProvider } from "./hotels.provider";
import { Hotel } from "../Models/Hotels";
import { Room } from "../Models/Rooms";
import { FileStorage } from "../utils/file-storage";

/** Перехватываем условие, с которым провайдер идёт в базу. */
function build() {
  const chain = { sort: () => chain, skip: () => chain, limit: () => Promise.resolve([]) };
  const captured: { query?: any } = {};
  const hotelModel = {
    find: jest.fn((q: unknown) => {
      captured.query = q;
      return chain;
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
  };

  return Test.createTestingModule({
    providers: [
      HotelsProvider,
      { provide: getModelToken(Hotel.name), useValue: hotelModel },
      { provide: getModelToken(Room.name), useValue: { aggregate: jest.fn().mockResolvedValue([]) } },
      { provide: FileStorage, useValue: { save: jest.fn() } },
    ],
  })
    .compile()
    .then((m) => ({ provider: m.get(HotelsProvider), captured }));
}

describe("HotelsProvider — условия поиска", () => {
  it("направления складываются по ИЛИ: гость смотрит и море, и горы", async () => {
    const { provider, captured } = await build();

    await provider.getAllHotels({ destinations: ["sea", "mountains"] } as never, null);

    expect(captured.query.destinations).toEqual({ $in: ["sea", "mountains"] });
  });

  it("удобства требуются все сразу: бассейн и спа в одном отеле", async () => {
    const { provider, captured } = await build();

    await provider.getAllHotels({ amenities: ["pool", "spa"] } as never, null);

    expect(captured.query.amenities).toEqual({ $all: ["pool", "spa"] });
  });

  it("пустые списки фильтров в условие не попадают", async () => {
    const { provider, captured } = await build();

    await provider.getAllHotels({ destinations: [], amenities: [] } as never, null);

    expect(captured.query.destinations).toBeUndefined();
    expect(captured.query.amenities).toBeUndefined();
  });

  it("удалённые отели не попадают в выдачу ни при каком фильтре", async () => {
    const { provider, captured } = await build();

    await provider.getAllHotels({ destinations: ["sea"] } as never, null);

    expect(captured.query.deletedAt).toBeNull();
  });

  it("спецсимволы в строке поиска экранируются", async () => {
    const { provider, captured } = await build();

    await provider.getAllHotels({ hotel: "(a+)+$" } as never, null);

    // String.raw, чтобы обратные слэши читались буквально и не путались с экранированием строки
    expect(captured.query.$or[0].title.$regex).toBe(String.raw`\(a\+\)\+\$`);
  });
});
