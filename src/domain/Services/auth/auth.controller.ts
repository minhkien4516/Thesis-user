import { compare } from 'bcrypt';
import {
  BadRequestException,
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
import { STUDENT_MAIL } from '../../../constants/auth.constant';
import { GrpcMethod } from '@nestjs/microservices';
import { SaveStudentAccountForOwnerRequest } from '../../interfaces/saveStudentAccountForOwnerRequest.interface';
import { SaveStudentAccountForOwnerResponse } from '../../interfaces/saveStudentAccountForOwnerResponse.interface';

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
      const { email, firstName, lastName, phoneNumber, role, id, studentId } =
        request.user;
      if (role === Role.student)
        return response.send({
          user: {
            email,
            firstName,
            lastName,
            phoneNumber,
            role,
            id,
            studentId,
          },
        });
      return response.send({
        user: {
          email,
          firstName,
          lastName,
          phoneNumber,
          role,
          id,
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @GrpcMethod('AuthService')
  async registerStudent(
    data: SaveStudentAccountForOwnerRequest,
  ): Promise<SaveStudentAccountForOwnerResponse> {
    try {
      await Promise.all(
        data.students.map(async (item) => {
          if (item.email.toString().includes(STUDENT_MAIL))
            item.role = Role.student;

          const checkUser = await this.userService.getUserByEmail(item.email);
          if (checkUser)
            throw new HttpException('Email exists!', HttpStatus.BAD_REQUEST);
          const students = await this.userService.createNewAccountStudent(item);

          if (students.length < 0)
            throw new HttpException(
              'Error when register account, please check again ',
              HttpStatus.BAD_REQUEST,
            );
          await this.authService.generateTokenForVerify(students[0].id);

          return item;
        }),
      );
      return { students: data.students };
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
      if (createUserDTO.email.toString().includes(STUDENT_MAIL)) {
        createUserDTO.role = Role.student;
      } else {
        createUserDTO.role = Role.corporation;
        createUserDTO.studentId = null;
      }
      const checkUser = await this.userService.getUserByEmail(
        createUserDTO.email,
      );
      if (checkUser)
        throw new HttpException('Email exists!', HttpStatus.BAD_REQUEST);
      const user = await this.userService.createNewUser(createUserDTO);
      console.log(user.role);
      const token = await this.authService.generateTokenForVerify(user.id);
      console.log(token);
      const { host } = request.headers;
      // const { email, firstName, lastName } = createUserDTO;
      // // await this.emailService.sendRegistrationMail(
      // //   email,
      // //   firstName,
      // //   lastName,
      // //   host,
      // //   token,
      // // );
      if (Object.values(user) != undefined)
        return {
          user,
          token,
          host,
          message: 'Register account successfully!',
        };
      throw new HttpException(
        'Error when register account, please check again ',
        HttpStatus.BAD_REQUEST,
      );
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
      console.log(updatedUser.length);
      if (!updatedUser.length)
        throw new HttpException('Phone number exists!', HttpStatus.BAD_REQUEST);
      return {
        user: updatedUser[0],
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(
        error.message,
        error?.status || HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Public()
  @Get('users')
  async getAllUsers() {
    try {
      return (await this.userService.getAllUsers()) || [];
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
