import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
// import { ReservationModule } from '../src/Modules/reservation.module'

describe("ReservationModule (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("Delete id", () => {
    return request(app.getHttpServer()).get(":id").expect(204);
  });

  afterAll(async () => {
    await app.close();
  });
});
