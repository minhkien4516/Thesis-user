import { StudentFilter } from './../../interfaces/getStudentForClients.interface';
import { Controller, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import { Observable } from 'rxjs';
import { universityPackageProvideToken } from '../../../constants/university.constant';
import { getStudentByIdForLoginRequest } from '../../interfaces/getStudentByIdForLoginRequest';
import { getTeacherByIdForLoginRequest } from '../../interfaces/getTeacherByIdForLoginRequest';
import { TeacherDetail } from '../../interfaces/getTeacherForClients.interface';

interface IUniversityService {
  getStudentByIdGrpc(
    data: getStudentByIdForLoginRequest,
  ): Observable<StudentFilter>;
  getTeacherByIdGrpc(
    data: getTeacherByIdForLoginRequest,
  ): Observable<TeacherDetail>;
}

@Controller()
export class UniversityService implements IUniversityService, OnModuleInit {
  private universityService!: IUniversityService;
  private readonly logger = new Logger(UniversityService.name);

  constructor(
    @Inject(universityPackageProvideToken) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.universityService = this.client.getService<IUniversityService>(
      UniversityService.name,
    );
  }

  getStudentByIdGrpc(
    data: getStudentByIdForLoginRequest,
  ): Observable<StudentFilter> {
    return this.universityService.getStudentByIdGrpc(data);
  }

  getTeacherByIdGrpc(
    data: getStudentByIdForLoginRequest,
  ): Observable<TeacherDetail> {
    return this.universityService.getTeacherByIdGrpc(data);
  }
}
