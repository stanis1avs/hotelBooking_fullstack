import { Resolver, Query, Mutation, Args, Int } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { ReservationsProvider } from "../../Providers/reservations.provider";
import { ClientReservationType, ManagerReservationType } from "../types/reservation.type";
import { CreateReservationInput } from "../inputs/create-reservation.input";
import { GqlJwtAuthGuard } from "../guards/gql-jwt.guard";
import { GqlRolesGuard } from "../guards/gql-roles.guard";
import { Roles } from "../decorators/roles.decorator";
import { CurrentUser } from "../decorators/current-user.decorator";
import { UserToJWTPayload } from "../../Interface/Users";

@Resolver()
export class ReservationsResolver {
  constructor(private readonly reservationsProvider: ReservationsProvider) {}

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("client")
  @Query(() => [ClientReservationType])
  async myReservations(@CurrentUser() user: UserToJWTPayload): Promise<ClientReservationType[]> {
    const reservations = await this.reservationsProvider.getReservationById(user.id);
    return reservations.map((r) => ({
      id: String(r.id),
      dateStart: r.dateStart,
      dateEnd: r.dateEnd,
      room: {
        description: r.room.description,
        images: (r.room.images as string[]) ?? [],
      },
      hotel: { title: r.hotel.title },
    }));
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("manager")
  @Query(() => [ManagerReservationType])
  async allReservations(
    @Args("offset", { type: () => Int, nullable: true, defaultValue: 0 }) offset: number
  ): Promise<ManagerReservationType[]> {
    const reservations = await this.reservationsProvider.getReservations({ offset });
    return reservations.map((r) => ({
      id: String(r.id),
      dateStart: r.dateStart,
      dateEnd: r.dateEnd,
      client: {
        id: String(r.client.id),
        name: r.client.name,
        contactPhone: r.client.contactPhone,
      },
      room: { description: r.room.description, images: [] },
      hotel: { title: r.hotel.title },
    }));
  }

  @UseGuards(GqlJwtAuthGuard, GqlRolesGuard)
  @Roles("client")
  @Mutation(() => ClientReservationType)
  async createReservation(
    @Args("input") input: CreateReservationInput,
    @CurrentUser() user: UserToJWTPayload
  ): Promise<ClientReservationType> {
    const r = await this.reservationsProvider.createReservation(input, user.id);
    return {
      id: String(r.id),
      dateStart: r.dateStart,
      dateEnd: r.dateEnd,
      room: {
        description: r.room.description,
        images: (r.room.images as string[]) ?? [],
      },
      hotel: { title: r.hotel.title },
    };
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Boolean)
  async deleteReservation(
    @Args("id") id: string,
    @CurrentUser() user: UserToJWTPayload
  ): Promise<boolean> {
    // managers pass null as userId to bypass ownership check; clients pass their own id
    const userId = user.role === "manager" ? null : user.id;
    await this.reservationsProvider.removeReservation(id, userId);
    return true;
  }
}
