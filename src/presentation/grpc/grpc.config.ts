import { GrpcOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

export const createGrpcConfig = (): GrpcOptions => {
  const grpcHost = process.env.GRPC_HOST || '0.0.0.0';
  const grpcPort = process.env.GRPC_PORT || '5001';
  const protoDir = process.env.PROTO_DIR || join(process.cwd(), 'proto');

  return {
    transport: Transport.GRPC,
    options: {
      package: ['user', 'product', 'order'],
      protoPath: [
        join(protoDir, 'user.proto'),
        join(protoDir, 'product.proto'),
        join(protoDir, 'order.proto'),
      ],
      url: `${grpcHost}:${grpcPort}`,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
      maxReceiveMessageLength: parseInt(process.env.GRPC_MAX_RECEIVE_MESSAGE_LENGTH || '4194304'), // 4MB
      maxSendMessageLength: parseInt(process.env.GRPC_MAX_SEND_MESSAGE_LENGTH || '4194304'), // 4MB
    },
  };
};

// Backward compatibility
export const grpcConfig = createGrpcConfig();
