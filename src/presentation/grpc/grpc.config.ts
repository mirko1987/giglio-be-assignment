import { GrpcOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

export const grpcConfig: GrpcOptions = {
  transport: Transport.GRPC,
  options: {
    package: ['user', 'product', 'order'],
    protoPath: [
      join(__dirname, '../../../proto/user.proto'),
      join(__dirname, '../../../proto/product.proto'),
      join(__dirname, '../../../proto/order.proto'),
    ],
    url: '0.0.0.0:5001',
    loader: {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    },
  },
};
