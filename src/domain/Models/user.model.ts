import { Model } from 'sequelize';
export class User extends Model {
  id: string;
  email: string;
  key: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: string;
  studentId: string;
  teacherId: string;
  phoneNumber: string;
  resetPasswordCode?: number;
  createdAt: Date;
  updatedAt: Date;
}
