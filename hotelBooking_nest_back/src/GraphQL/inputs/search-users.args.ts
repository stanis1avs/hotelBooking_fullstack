import { ArgsType, Field, Int } from "@nestjs/graphql";

@ArgsType()
export class SearchUsersArgs {
  @Field(() => Int, { nullable: true, defaultValue: 50 })
  limit: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  offset: number;

  @Field({ nullable: true, defaultValue: "" })
  email: string;

  @Field({ nullable: true, defaultValue: "" })
  name: string;

  @Field({ nullable: true, defaultValue: "" })
  contactPhone: string;
}
