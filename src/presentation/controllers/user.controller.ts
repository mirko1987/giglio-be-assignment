import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  CreateUserUseCase,
  CreateUserRequest,
} from '../../application/use-cases/create-user.use-case';
import { UserRepositoryPort } from '../../application/ports/user.repository.port';
import { UserResponseDto } from '../dto/user-response.dto';

export interface CreateUserDto {
  name: string;
  email: string;
}

@ApiTags('Users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with email already exists',
  })
  createUser(@Body() createUserDto: CreateUserDto): Observable<UserResponseDto> {
    const request: CreateUserRequest = {
      name: createUserDto.name,
      email: createUserDto.email,
    };

    return this.createUserUseCase.execute(request).pipe(
      map(
        (response) =>
          ({
            userId: response.userId,
            name: response.name,
            email: response.email,
            createdAt: response.createdAt,
          }) as UserResponseDto,
      ),
      catchError((error) => {
        throw new Error(`Failed to create user: ${error.message}`);
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  getUser(@Param('id') id: string): Observable<UserResponseDto> {
    return this.userRepository.findById(id).pipe(
      map((user) => {
        if (!user) {
          throw new Error(`User with ID ${id} not found`);
        }
        return {
          userId: user.id,
          name: user.name,
          email: user.email.value,
          createdAt: user.createdAt,
        } as UserResponseDto;
      }),
      catchError((error) => {
        throw new Error(`Failed to get user: ${error.message}`);
      }),
    );
  }
}
