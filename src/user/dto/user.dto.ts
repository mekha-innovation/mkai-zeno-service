import { UserType } from '../schemas/user.schema';

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  type: UserType;
}
