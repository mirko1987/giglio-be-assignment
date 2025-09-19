import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable, map, catchError, throwError, of } from 'rxjs';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { UserRepositoryPort } from '../../application/ports/user.repository.port';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

// gRPC Request/Response interfaces (based on proto definitions)
interface CreateUserRequest {
  name: string;
  email: string;
}

interface GetUserRequest {
  id: string;
}

interface GetUserByEmailRequest {
  email: string;
}

interface ListUsersRequest {
  page?: number;
  limit?: number;
}

interface UpdateUserRequest {
  id: string;
  name?: string;
  email?: string;
}

interface DeleteUserRequest {
  id: string;
}

interface UserResponse {
  user: {
    id: string;
    name: string;
    email: string;
    created_at: string;
  };
}

interface ListUsersResponse {
  users: Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

interface DeleteUserResponse {
  success: boolean;
  message: string;
}

@Controller()
export class UserGrpcController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort
  ) {}

  @GrpcMethod('UserService', 'CreateUser')
  createUser(request: CreateUserRequest): Observable<UserResponse> {
    return this.createUserUseCase.execute({
      name: request.name,
      email: request.email
    }).pipe(
      map(response => ({
        user: {
          id: response.userId,
          name: response.name,
          email: response.email,
          created_at: response.createdAt.toISOString()
        }
      })),
      catchError(error => {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: error.message
        });
      })
    );
  }

  @GrpcMethod('UserService', 'GetUser')
  getUser(request: GetUserRequest): Observable<UserResponse> {
    return this.userRepository.findById(request.id).pipe(
      map(user => {
        if (!user) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `User with ID ${request.id} not found`
          });
        }
        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email.value,
            created_at: user.createdAt.toISOString()
          }
        };
      }),
      catchError(error => {
        throw new RpcException({
          code: status.INTERNAL,
          message: error.message
        });
      })
    );
  }

  @GrpcMethod('UserService', 'GetUserByEmail')
  getUserByEmail(request: GetUserByEmailRequest): Observable<UserResponse> {
    return this.userRepository.findByEmail(request.email).pipe(
      map(user => {
        if (!user) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `User with email ${request.email} not found`
          });
        }
        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email.value,
            created_at: user.createdAt.toISOString()
          }
        };
      }),
      catchError(error => {
        throw new RpcException({
          code: status.INTERNAL,
          message: error.message
        });
      })
    );
  }

  @GrpcMethod('UserService', 'ListUsers')
  listUsers(request: ListUsersRequest): Observable<ListUsersResponse> {
    const page = request.page || 1;
    const limit = request.limit || 10;

    return this.userRepository.findAll().pipe(
      map(users => ({
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email.value,
          created_at: user.createdAt.toISOString()
        })),
        total: users.length,
        page: page,
        limit: limit
      })),
      catchError(error => {
        throw new RpcException({
          code: status.INTERNAL,
          message: error.message
        });
      })
    );
  }

  @GrpcMethod('UserService', 'DeleteUser')
  deleteUser(request: DeleteUserRequest): Observable<DeleteUserResponse> {
    return this.userRepository.delete(request.id).pipe(
      map(() => ({
        success: true,
        message: `User with ID ${request.id} deleted successfully`
      })),
      catchError(error => {
        throw new RpcException({
          code: status.INTERNAL,
          message: error.message
        });
      })
    );
  }
}
