import { ArgsType, Field, Int } from "@nestjs/graphql";
import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";
import { ROLES } from "../../Interface/Users";

@ArgsType()
export class SearchUsersArgs {
  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset: number;

  @Field({ nullable: true, defaultValue: "" })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  email: string;

  @Field({ nullable: true, defaultValue: "" })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  name: string;

  @Field({ nullable: true, defaultValue: "" })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  contactPhone: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(ROLES)
  role?: string;
}
