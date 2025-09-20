import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserRepositoryPort } from '../../application/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from '../database/entities/user.orm-entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  save(user: User): Observable<User> {
    const userOrm = UserMapper.toOrmEntity(user);

    return from(this.userRepository.save(userOrm)).pipe(
      map((savedUserOrm) => UserMapper.toDomainEntity(savedUserOrm)),
      catchError((error) => throwError(() => new Error(`Failed to save user: ${error.message}`))),
    );
  }

  findById(id: string): Observable<User | null> {
    return from(this.userRepository.findOne({ where: { id } })).pipe(
      map((userOrm) => (userOrm ? UserMapper.toDomainEntity(userOrm) : null)),
      catchError((error) =>
        throwError(() => new Error(`Failed to find user by ID: ${error.message}`)),
      ),
    );
  }

  findByEmail(email: string): Observable<User | null> {
    return from(this.userRepository.findOne({ where: { email } })).pipe(
      map((userOrm) => (userOrm ? UserMapper.toDomainEntity(userOrm) : null)),
      catchError((error) =>
        throwError(() => new Error(`Failed to find user by email: ${error.message}`)),
      ),
    );
  }

  findAll(): Observable<User[]> {
    return from(this.userRepository.find({ order: { createdAt: 'DESC' } })).pipe(
      map((usersOrm) => usersOrm.map((userOrm) => UserMapper.toDomainEntity(userOrm))),
      catchError((error) =>
        throwError(() => new Error(`Failed to find all users: ${error.message}`)),
      ),
    );
  }

  delete(id: string): Observable<void> {
    return from(this.userRepository.delete(id)).pipe(
      map((result) => {
        if (result.affected === 0) {
          throw new Error(`User with ID ${id} not found`);
        }
      }),
      catchError((error) => throwError(() => new Error(`Failed to delete user: ${error.message}`))),
    );
  }

  exists(id: string): Observable<boolean> {
    return from(this.userRepository.exists({ where: { id } })).pipe(
      catchError((error) =>
        throwError(() => new Error(`Failed to check user existence: ${error.message}`)),
      ),
    );
  }
}
