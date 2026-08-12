import { ObjectType, Field, Float, Int } from "@nestjs/graphql";

@ObjectType()
export class MetricType {
  @Field(() => Float)
  value: number;

  /** Изменение к предыдущему периоду, % */
  @Field(() => Float)
  delta: number;

  /** Ряд по дням для спарклайна */
  @Field(() => [Float])
  series: number[];
}

@ObjectType()
export class ManagerStatsType {
  @Field(() => Int)
  days: number;

  @Field(() => MetricType)
  revenue: MetricType;

  @Field(() => MetricType)
  bookings: MetricType;

  @Field(() => MetricType)
  upcoming: MetricType;

  @Field(() => MetricType)
  staying: MetricType;
}
