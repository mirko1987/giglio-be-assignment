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
  HttpException,
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
        // Check if it's a validation error
        if (error.message && (error.message.includes('Email format') || error.message.includes('validation'))) {
          throw new HttpException(`Validation error: ${error.message}`, HttpStatus.BAD_REQUEST);
        }
        // Check if it's a duplicate user error
        if (error.message && error.message.includes('already exists')) {
          throw new HttpException(`User already exists: ${error.message}`, HttpStatus.CONFLICT);
        }
        // Generic error
        throw new HttpException(`Failed to create user: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
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
        // Check if it's a user not found error
        if (error.message && error.message.includes('User with ID') && error.message.includes('not found')) {
          throw new HttpException(`User not found`, HttpStatus.NOT_FOUND);
        }
        // Generic error
        throw new HttpException(`Failed to get user: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }),
    );
  }
}
