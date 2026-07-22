import { PartialType } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreateTeamMemberDto {
  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEmail()
  email!: string;
}

export class UpdateTeamMemberDto extends PartialType(CreateTeamMemberDto) {}
