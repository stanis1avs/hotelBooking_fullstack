import { ArgsType, Field, Int } from "@nestjs/graphql";

@ArgsType()
export class SearchHotelsArgs {
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  offset: number;

  @Field({ nullable: true })
  hotel?: string;

  @Field()
  dateArrival: string;

  @Field()
  dateDeparture: string;
}
