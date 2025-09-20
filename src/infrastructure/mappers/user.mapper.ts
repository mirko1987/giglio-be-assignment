import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from '../database/entities/user.orm-entity';
import { Email } from '../../domain/value-objects/email';

export class UserMapper {
  static toOrmEntity(user: User): UserOrmEntity {
    const userOrm = new UserOrmEntity();
    userOrm.id = user.id;
    userOrm.name = user.name;
    userOrm.email = user.email.value;
    userOrm.createdAt = user.createdAt;
    return userOrm;
  }

  static toDomainEntity(userOrm: UserOrmEntity): User {
    const email = new Email(userOrm.email);

    return new User(userOrm.id, email, userOrm.name, userOrm.createdAt);
  }
}
