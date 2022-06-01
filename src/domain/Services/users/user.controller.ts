import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { UserService } from './user.service';
import { compare } from 'bcrypt';

@Controller('user')
export class UserController {
  private readonly logger = new Logger('UserController');

  constructor(private userService: UserService) {}

  @Post()
  async createNewUser(@Body() createUserDTO: CreateUserDTO) {
    try {
      const id = await this.userService.createNewUser(createUserDTO);
      return id;
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get()
  async getUserById(@Query('id') id: string) {
    try {
      const user = await this.userService.getUserById(id);
      return user;
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('all')
  async getAllUsers() {
    try {
      const user = await this.userService.getAllUsers();
      return user;
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('check_password')
  async checkPassword(
    @Query('userId') userId: string,
    @Query('currentPassword') currentPassword: string,
  ) {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      const passwordMatch = await compare(currentPassword, user.key);
      return passwordMatch;
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('email')
  async getUserByEmail(@Query('name') name: string) {
    try {
      const user = await this.userService.getUserByEmail(name);
      return user;
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('generate-password')
  async generateResetPasswordCode(@Query('email') email: string) {
    try {
      const user = await this.userService.generateResetPasswordCode(email);
      return user;
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('hotline')
  async getUserByHotLine(@Query('number') number: string) {
    try {
      const user = await this.userService.getUserByPhoneNumber(number);
      return user;
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Patch()
  async updateProfileUser(
    @Query('id') id: string,
    @Body() updateUserDTO: UpdateUserDTO,
  ) {
    try {
      const result = await this.userService.updateUserProfile(
        id,
        updateUserDTO,
      );
      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Patch('change_password')
  public async updatePassword(
    @Query('id') id: string,
    @Query('password') password: string,
  ) {
    try {
      const result = await this.userService.changePassword(id, password);
      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Patch('reset_password')
  public async resetPassword(
    @Query('email') email: string,
    @Query('password') password: string,
  ) {
    try {
      const result = await this.userService.resetPassword(email, password);
      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
