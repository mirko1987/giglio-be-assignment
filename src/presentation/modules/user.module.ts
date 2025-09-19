import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '../controllers/user.controller';
import { UserOrmEntity } from '../../infrastructure/database/entities/user.orm-entity';
import { UserRepositoryAdapter } from '../../infrastructure/repositories/user.repository.adapter';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { UserRepositoryPort } from '../../application/ports/user.repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity]),
  ],
  controllers: [UserController],
  providers: [
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepositoryAdapter,
    },
    CreateUserUseCase,
  ],
})
export class UserModule {}
