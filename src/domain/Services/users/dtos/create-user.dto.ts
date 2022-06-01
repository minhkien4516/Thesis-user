import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  email?: string | null;

  @IsString()
  @IsNotEmpty()
  password?: string | null;

  @IsString()
  @IsNotEmpty()
  firstName?: string | null;

  @IsString()
  @IsNotEmpty()
  lastName?: string | null;

  @IsString()
  @IsNotEmpty()
  phoneNumber?: string | null;

  @IsString()
  @IsNotEmpty()
  role?: string | null;
}
