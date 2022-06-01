import { compare } from 'bcrypt';
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CreateUserDTO } from '../users/dtos/create-user.dto';
import { UpdateUserDTO } from '../users/dtos/update-user.dto';
import { UserService } from '../users/user.service';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger('AuthController');

  constructor(
    private readonly authService: AuthService,
    private userService: UserService,
  ) {}

  @Public()
  @Get()
  async getProfile(@Req() req, @Res() response: Response) {
    try {
      const userID = await this.authService.verifyToken(
        req.cookies.token,
        response,
      );
      const user = await this.userService.getUserById(userID);
      const { email, firstName, lastName, phoneNumber, role, id } = user;
      response
        .status(200)
        .json({ user: { email, firstName, lastName, phoneNumber, role, id } });
    } catch (error) {
      response.clearCookie('token');
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() request, @Res() response: Response) {
    try {
      const token = await this.authService.getCookieWithJwtToken(
        request.user.id,
        request.user.role,
      );
      response.cookie('token', token);
      const { email, firstName, lastName, phoneNumber, role, id } =
        request.user;
      return response.send({
        user: { email, firstName, lastName, phoneNumber, role, id },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Public()
  @Post()
  async register(
    @Body() createUserDTO: CreateUserDTO,
    @Req() request: Request,
  ) {
    try {
      createUserDTO.role = Role.corporation;
      const checkUser = await this.getUserByEmail(createUserDTO.email);
      if (checkUser)
        throw new HttpException('Email exists!', HttpStatus.BAD_REQUEST);
      const user = await this.userService.createNewUser(createUserDTO);
      console.log(user.id);
      const token = await this.authService.generateTokenForVerify(user.id);
      console.log(token);
      // const { email, firstName, lastName } = createUserDTO;
      // const { host } = request.headers;
      // // await this.emailService.sendRegistrationMail(
      // //   email,
      // //   firstName,
      // //   lastName,
      // //   host,
      // //   token,
      // // );
      return {
        user,
        token,
        // message:
        //   'Register account successfully! ' +
        //   'A verification link has been sent to your email, ' +
        //   'please click that link it to activate your account.',
        // status: HttpStatus.CREATED,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Public()
  @Post('resendVerificationEmail')
  async resendVerificationEmail(
    @Body('email') email: string,
    @Req() request: Request,
  ) {
    try {
      const user = await this.userService.getUserByEmail(email);
      if (!user)
        throw new HttpException(
          'Email does not exist!',
          HttpStatus.BAD_REQUEST,
        );
      if (user.isActive)
        throw new HttpException(
          'Your email has been activated already!',
          HttpStatus.BAD_REQUEST,
        );
      const token = await this.authService.generateTokenForVerify(user.id);
      const { firstName, lastName } = user;
      const { host } = request.headers;
      // this.emailService.sendRegistrationMail(
      //   email,
      //   firstName,
      //   lastName,
      //   host,
      //   token,
      // );
      return { message: 'Verification email sent!' };
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Public()
  @Post('resetPasswordCode')
  async sendCodeToResetPassword(@Body('email') email: string) {
    try {
      const resetPasswordCode =
        await this.userService.generateResetPasswordCode(email);
      // await this.emailService.sendResetPasswordCode(email, resetPasswordCode);
      return {
        message:
          'We have just sent instruction to your email! Please check your email!',
        status: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Public()
  @Post('checkResetPasswordCode')
  async checkResetPasswordCode(
    @Body() data: { resetPasswordCode: string; email: string },
  ) {
    try {
      const user = await this.userService.getUserByEmail(data.email);
      if (!user) throw new Error('Email does not exist!');

      return {
        isValid: data.resetPasswordCode === user.resetPasswordCode,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Public()
  @Patch('resetPassword')
  async resetPassword(@Body() data: { email: string; password: string }) {
    try {
      await this.userService.resetPassword(data.email, data.password);
      return { message: 'Reset password successfully!' };
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Public()
  @Post('logout')
  logout(@Res() response: Response) {
    response.clearCookie('token');
    return response.sendStatus(200);
  }

  @Public()
  @Get('emails/:email')
  async getUserByEmail(@Param('email') email: string) {
    try {
      const doesExist = await this.userService.getUserByEmail(email);
      return { doesExist };
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Public()
  @Get('phoneNumbers/:phoneNumber')
  async getUserByPhoneNumber(@Param('phoneNumber') phoneNumber: string) {
    try {
      const doesExist = await this.userService.getUserByPhoneNumber(
        phoneNumber,
      );
      return { doesExist };
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // @Public()
  // @Get('confirmation/:token')
  // async activateAccount(
  //   @Param('token') token: string,
  //   @Req() request: Request,
  //   @Res() response: Response,
  // ) {
  //   try {
  //     const userId = await this.authService.verifyToken(token, response);
  //     if (!userId)
  //       throw new HttpException('Token is not valid!', HttpStatus.BAD_REQUEST);
  //     const user = await this.userService.activateUser(userId);
  //     let redirectUrl = `http://${request.headers.host}`;
  //     if (user.role === Role.corporation) redirectUrl += '/login';
  //     response.status(201).redirect(redirectUrl);
  //   } catch (error) {
  //     this.logger.error(error.message);
  //     throw new HttpException(
  //       error.message,
  //       error?.status || HttpStatus.SERVICE_UNAVAILABLE,
  //     );
  //   }
  // }

  @Patch(':userId/password')
  async changePassword(
    @Param('userId') userId: string,
    @Body() data: { currentPassword: string; newPassword: string },
  ) {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user)
        throw new HttpException('User does not exist!', HttpStatus.BAD_REQUEST);
      const passwordDoesMatch = await compare(data.currentPassword, user.key);
      if (!passwordDoesMatch) throw new Error('Password is wrong!');

      const result = await this.userService.changePassword(
        userId,
        data.newPassword,
      );
      return {
        message: 'Password changed successfully!',
        status: HttpStatus.OK,
        result,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Public()
  @Patch(':userId')
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() updateUserDTO: UpdateUserDTO,
  ) {
    try {
      const updatedUser = await this.userService.updateUserProfile(
        userId,
        updateUserDTO,
      );
      if (Object.values(updatedUser)[0].phoneNumber === 1)
        throw new HttpException('Phone number exists!', HttpStatus.BAD_REQUEST);
      return {
        user: updatedUser[0],
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Public()
  @Get('users')
  async getAllUsers() {
    try {
      const [result, error] = await this.userService.getAllUsers();
      if (error) {
        console.log(error);
        throw new HttpException(error, HttpStatus.BAD_REQUEST);
      }
      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // @Public()
  // @Get('users/report')
  // async getNumberOfUsers(@Query('year') year: number) {
  //   const [data, error] = await this.userService.getNumberOfUsers(year);
  //   if (error) {
  //     throw new HttpException(error, HttpStatus.BAD_REQUEST);
  //   }
  //   return data;
  // }
}
