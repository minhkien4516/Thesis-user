import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import * as Mail from 'nodemailer/lib/mailer';

@Injectable()
export default class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendRegistrationMail(
    email: string,
    firstName: string,
    lastName: string,
    host: string,
    token: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify your account',
        template: './email.hbs',
        context: {
          firstName,
          lastName,
          host,
          token,
        },
        html:
          `<h2>Hello ${lastName} ${firstName}</h2>` +
          `<h3>Welcome you to my BIG thesis-app</h3>` +
          `<h3>Thanks for joining to my system</h3>` +
          '<p>Please verify your account by clicking this:</p>' +
          `<a style='text-decoration: none' ` +
          `href='http://${host}/auth/confirmation/${token}'>` +
          `<h1 style='display: inline-block, color: #0194f3'>Verification link</h1>` +
          `</a>` +
          `<br />` +
          '<h4>Thank You!</h4>',
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async sendResetPasswordCode(email: string, resetPasswordCode: number) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your password',
        html:
          `<p>Here is your reset password code:</p>` +
          `<h1 style='display: inline-block'>${resetPasswordCode}</h1>` +
          `<p>Please do not share this code to anyone!</p>` +
          `<br />` +
          '<h4>Thank You!</h4>',
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
