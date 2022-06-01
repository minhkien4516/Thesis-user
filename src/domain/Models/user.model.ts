import { Model } from 'sequelize';
export class User extends Model {
  id: string;
  email: string;
  key: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: string;
  phoneNumber: string;
  resetPasswordCode?: string;
  createdAt: Date;
  updatedAt: Date;
}
