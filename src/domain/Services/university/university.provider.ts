import { universityPackageProvideToken } from './../../../constants/university.constant';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';

export const universityProvider = [
  {
    provide: universityPackageProvideToken,
    useFactory: (configService: ConfigService) => {
      return ClientProxyFactory.create({
        transport: Transport.GRPC,
        options: {
          package: 'university',
          protoPath: join(__dirname, './university.proto'),
          url: configService.get('UNIVERSITY_GRPC_CONNECTION_URL'),
        },
      });
    },
    inject: [ConfigService],
  },
];
