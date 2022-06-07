import { Injectable, Logger } from '@nestjs/common';
import { hash } from 'bcrypt';
import { Sequelize } from 'sequelize-typescript';
import { DatabaseError, QueryTypes } from 'sequelize';
import { CreateUserDTO } from './dtos/create-user.dto';
import { User } from '../../Models/user.model';
import { UpdateUserDTO } from './dtos/update-user.dto';
@Injectable()
export class UserService {
  private readonly logger = new Logger('UserService');

  constructor(private readonly sequelize: Sequelize) {}

  async createNewUser(createUserDTO: CreateUserDTO) {
    try {
      const key = await hash(createUserDTO.password, 12);
      const user = await this.sequelize.query(
        'SP_CreateNewUser @email=:email, @key=:key, ' +
          '@presenterFirstName=:firstName, @presenterLastName=:lastName, ' +
          '@presenterPhoneNumber=:phoneNumber, @role=:role',
        {
          type: QueryTypes.SELECT,
          replacements: {
            email: createUserDTO.email,
            firstName: createUserDTO.firstName,
            lastName: createUserDTO.lastName,
            phoneNumber: createUserDTO.phoneNumber,
            role: createUserDTO.role,
            key,
          },
          raw: true,
          mapToModel: true,
          model: User,
        },
      );
      return user[0];
    } catch (error) {
      this.logger.error(error.message);
      throw new DatabaseError(error);
    }
  }

  async createNewAccountStudent(createUserDTO: CreateUserDTO) {
    try {
      const key = await hash(createUserDTO.password, 12);
      const user = await this.sequelize.query(
        'SP_CreateNewUser @email=:email, @key=:key, ' +
          '@presenterFirstName=:firstName, @presenterLastName=:lastName, ' +
          '@presenterPhoneNumber=:phoneNumber, @role=:role',
        {
          type: QueryTypes.SELECT,
          replacements: {
            email: createUserDTO.email,
            firstName: createUserDTO.firstName,
            lastName: createUserDTO.lastName,
            phoneNumber: createUserDTO.phoneNumber,
            role: createUserDTO.role,
            key,
          },
          raw: true,
          mapToModel: true,
          model: User,
        },
      );
      return user;
    } catch (error) {
      this.logger.error(error.message);
      throw new DatabaseError(error);
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const user = await this.sequelize.query('SP_GetUserById @id=:id', {
        type: QueryTypes.SELECT,
        replacements: { id: userId },
        raw: true,
        mapToModel: true,
        model: User,
      });
      return user[0];
    } catch (error) {
      this.logger.error(error.message);
      throw new DatabaseError(error);
    }
  }

  async getUserByEmail(email: string): Promise<User> {
    try {
      const user = await this.sequelize.query(
        'SP_GetUserByEmail @email=:email',
        {
          type: QueryTypes.SELECT,
          replacements: { email },
          raw: true,
          mapToModel: true,
          model: User,
        },
      );
      return user[0];
    } catch (error) {
      this.logger.error(error.message);
      throw new DatabaseError(error);
    }
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User> {
    try {
      const user = await this.sequelize.query(
        'SP_GetUserByPhoneNumber @phoneNumber=:phoneNumber',
        {
          type: QueryTypes.SELECT,
          replacements: { phoneNumber },
          raw: true,
          mapToModel: true,
          model: User,
        },
      );
      return user[0];
    } catch (error) {
      this.logger.error(error.message);
      throw new DatabaseError(error);
    }
  }

  async updateUserProfile(id: string, updateUserDTO?: UpdateUserDTO) {
    try {
      const updated = await this.sequelize.query(
        'SP_EditUserProfile @id=:id, @firstName=:firstName, ' +
          '@lastName=:lastName, @phoneNumber=:phoneNumber',
        {
          type: QueryTypes.SELECT,
          replacements: {
            id,
            firstName: updateUserDTO.firstName ?? null,
            lastName: updateUserDTO.lastName ?? null,
            phoneNumber: updateUserDTO.phoneNumber ?? null,
          },
          raw: true,
          mapToModel: true,
          model: User,
        },
      );

      return updated[0];
    } catch (error) {
      this.logger.error(error.message);
      throw new DatabaseError(error);
    }
  }

  async getAllUsers() {
    try {
      const result = await this.sequelize.query('SELECT * FROM Users', {
        type: QueryTypes.SELECT,
        raw: true,
        mapToModel: true,
        model: User,
      });
      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw new DatabaseError(error);
    }
  }

  async changePassword(userId: string, newPassword: string) {
    try {
      const key = await hash(newPassword, 12);
      const result = await this.sequelize.query(
        'SP_ChangePassword @userId=:userId, @key=:key',
        {
          type: QueryTypes.UPDATE,
          replacements: { userId, key },
        },
      );
      return !!result[1];
    } catch (error) {
      this.logger.error(error.message);
      throw new DatabaseError(error);
    }
  }

  async generateResetPasswordCode(email: string): Promise<number> {
    try {
      const resetPasswordCode = await this.sequelize.query(
        'SP_GenerateResetPasswordCode @email=:email',
        {
          type: QueryTypes.SELECT,
          replacements: { email },
          raw: true,
        },
      );
      return resetPasswordCode[0]['resetPasswordCode'];
    } catch (error) {
      this.logger.error(error.message);
      throw new DatabaseError(error);
    }
  }

  async resetPassword(email: string, password: string) {
    try {
      const key = await hash(password, 12);
      await this.sequelize.query('SP_ResetPassword @email=:email, @key=:key', {
        type: QueryTypes.UPDATE,
        replacements: { email, key },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new DatabaseError(error);
    }
  }
}
