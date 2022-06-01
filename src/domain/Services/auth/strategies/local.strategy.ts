import { compare } from 'bcrypt';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserService } from '../../users/user.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    try {
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        throw new HttpException(
          'Email does not exist!',
          HttpStatus.BAD_REQUEST,
        );
      }
      const isPasswordMatching = await compare(password, user.key);
      if (!isPasswordMatching)
        throw new HttpException(
          'Password is not correct!',
          HttpStatus.BAD_REQUEST,
        );
      if (!user.isActive)
        throw new HttpException(
          'Your email has not been activated!',
          HttpStatus.BAD_REQUEST,
        );
      return user;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
