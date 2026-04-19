import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateReservationInput {
  @Field()
  roomId: string;

  @Field()
  dateStart: string;

  @Field()
  dateEnd: string;
}
