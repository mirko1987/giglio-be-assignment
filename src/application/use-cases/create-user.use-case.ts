import { Injectable, Inject } from '@nestjs/common';
import { Observable, of, throwError, switchMap, catchError } from 'rxjs';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../ports/user.repository.port';
import { Email } from '../../domain/value-objects/email';

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface CreateUserResponse {
  userId: string;
  name: string;
  email: string;
  createdAt: Date;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort
  ) {}

  execute(request: CreateUserRequest): Observable<CreateUserResponse> {
    return this.validateEmailUniqueness(request.email).pipe(
      switchMap(() => this.createUser(request)),
      switchMap(user => this.saveUser(user)),
      switchMap(user => of(this.mapToResponse(user))),
      catchError(error => {
        console.error('Error in CreateUserUseCase:', error);
        return throwError(() => new Error(`Failed to create user: ${error.message}`));
      })
    );
  }

  private validateEmailUniqueness(email: string): Observable<void> {
    return this.userRepository.findByEmail(email).pipe(
      switchMap(existingUser => {
        if (existingUser) {
          return throwError(() => new Error(`User with email ${email} already exists`));
        }
        return of(void 0);
      })
    );
  }

  private createUser(request: CreateUserRequest): Observable<User> {
    try {
      const email = new Email(request.email);
      const user = User.create(email, request.name);
      return of(user);
    } catch (error) {
      return throwError(() => error);
    }
  }

  private saveUser(user: User): Observable<User> {
    return this.userRepository.save(user);
  }

  private mapToResponse(user: User): CreateUserResponse {
    return {
      userId: user.id,
      name: user.name,
      email: user.email.value,
      createdAt: user.createdAt
    };
  }
}

