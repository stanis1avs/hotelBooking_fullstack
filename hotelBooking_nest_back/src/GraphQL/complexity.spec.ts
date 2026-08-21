import { buildSchema, parse, validate } from "graphql";
import depthLimit = require("graphql-depth-limit");
import { fieldExtensionsEstimator, getComplexity, simpleEstimator } from "graphql-query-complexity";

/**
 * Пороги защиты GraphQL проверяются на форме запросов, а не на глаз.
 *
 * Схема здесь урезанная, но с той же особенностью, ради которой всё затевалось:
 * у отеля есть список номеров, а у номера — ссылка обратно на отель.
 * В боевой схеме такой связи пока нет, но она напрашивается, и тогда
 * `hotel → rooms → hotel → …` раскручивается на любую глубину.
 */
const schema = buildSchema(`
  type Hotel { id: ID!, title: String!, image: String, rooms: [Room!]! }
  type Room { id: ID!, title: String!, hotel: Hotel! }
  type Query { hotels(dateArrival: String!, dateDeparture: String!): [Hotel!]! }
`);

const MAX_COMPLEXITY = 1000;
const MAX_DEPTH = 7;

const costOf = (query: string): number =>
  getComplexity({
    schema,
    query: parse(query),
    estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
  });

describe("Пороги защиты GraphQL", () => {
  describe("сложность", () => {
    it("пропускает обычный запрос списка отелей", () => {
      const cost = costOf(`
        query { hotels(dateArrival: "2026-01-01", dateDeparture: "2026-01-05") {
          id title image rooms { id title }
        } }
      `);
      expect(cost).toBeLessThan(MAX_COMPLEXITY);
    });

    it("отклоняет пятьсот алиасов одного и того же запроса", () => {
      // Ограничитель частоты здесь бессилен: для него это один HTTP-запрос.
      const aliases = Array.from({ length: 500 }, (_, i) =>
        `a${i}: hotels(dateArrival: "2026-01-01", dateDeparture: "2026-01-05") { id title image }`
      ).join("\n");

      expect(costOf(`query {\n${aliases}\n}`)).toBeGreaterThan(MAX_COMPLEXITY);
    });
  });

  describe("глубина", () => {
    const errorsFor = (query: string) => validate(schema, parse(query), [depthLimit(MAX_DEPTH)]);

    it("пропускает самый вложенный запрос приложения", () => {
      // hotels → rooms → hotel → title, глубже клиент не ходит
      expect(
        errorsFor(`query { hotels(dateArrival: "a", dateDeparture: "b") { rooms { hotel { title } } } }`)
      ).toHaveLength(0);
    });

    it("отклоняет раскрученную рекурсию", () => {
      const deep = `query { hotels(dateArrival: "a", dateDeparture: "b") {
        rooms { hotel { rooms { hotel { rooms { hotel { rooms { hotel { title } } } } } } } }
      } }`;
      expect(errorsFor(deep).length).toBeGreaterThan(0);
    });
  });
});
