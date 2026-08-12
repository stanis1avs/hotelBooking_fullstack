import { Resolver, Query, Args, Int } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { StatsProvider } from "../../Providers/stats.provider";
import { ManagerStatsType } from "../types/stats.type";
import { GqlJwtAuthGuard } from "../guards/gql-jwt.guard";
import { GqlRolesGuard } from "../guards/gql-roles.guard";
import { Roles } from "../decorators/roles.decorator";

@Resolver()
export class StatsResolver {
  constructor(private readonly statsProvider: StatsProvider) {}

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("manager", "admin")
  @Query(() => ManagerStatsType)
  async managerStats(
    @Args("days", { type: () => Int, nullable: true, defaultValue: 30 }) days: number
  ): Promise<ManagerStatsType> {
    return this.statsProvider.managerStats(Math.min(Math.max(days, 7), 90));
  }
}
