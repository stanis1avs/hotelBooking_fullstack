import { Logger } from "@nestjs/common";
import { ApolloServerPlugin, GraphQLRequestListener } from "@apollo/server";
import { GraphQLError } from "graphql";
import { fieldExtensionsEstimator, getComplexity, simpleEstimator } from "graphql-query-complexity";

/**
 * Ограничение сложности запроса.
 *
 * Глубину закрывает depthLimit, но плоский запрос может быть тяжёлым и без
 * вложенности: алиасы позволяют вызвать одно и то же поле сколько угодно раз
 * в пределах одного HTTP-запроса. Для ограничителя частоты это один запрос,
 * то есть он здесь бесполезен, а пятьсот алиасов по десять отелей — уже
 * заметная нагрузка на базу и мегабайты в ответе.
 *
 * Стоимость считается до выполнения: запрос отклоняется, ничего не выполнив.
 */
export function complexityPlugin(maxComplexity: number): ApolloServerPlugin {
  const logger = new Logger("GraphQLComplexity");

  return {
    async requestDidStart(): Promise<GraphQLRequestListener<never>> {
      return {
        async didResolveOperation({ request, document, schema }) {
          const complexity = getComplexity({
            schema,
            query: document,
            variables: request.variables,
            operationName: request.operationName,
            estimators: [
              // Позволяет пометить дорогое поле через extensions: { complexity }
              fieldExtensionsEstimator(),
              simpleEstimator({ defaultComplexity: 1 }),
            ],
          });

          if (complexity > maxComplexity) {
            throw new GraphQLError(
              `Запрос слишком тяжёлый: стоимость ${complexity} при допустимых ${maxComplexity}`,
              { extensions: { code: "QUERY_TOO_COMPLEX" } }
            );
          }

          // Предупреждение заранее: если легальные запросы подобрались к порогу,
          // это видно до того, как клиент начнёт получать отказы.
          if (complexity > maxComplexity * 0.6) {
            logger.warn(`${request.operationName ?? "запрос"}: стоимость ${complexity} из ${maxComplexity}`);
          }
        },
      };
    },
  };
}
