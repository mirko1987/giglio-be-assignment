import { Observable } from 'rxjs';
import { User } from '../../domain/entities/user.entity';

export interface UserRepositoryPort {
  save(user: User): Observable<User>;
  findById(id: string): Observable<User | null>;
  findByEmail(email: string): Observable<User | null>;
  findAll(): Observable<User[]>;
  delete(id: string): Observable<void>;
  exists(id: string): Observable<boolean>;
}
