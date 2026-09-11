import { getCurrentUsername } from '../security-utils';
import type { User } from '../model/user.entity';
import { UserRepository } from '../repository/user.repository';

/**
 * Port of `org.zerhusen.security.service.UserService`.
 *
 * `Optional.flatMap` becomes an explicit undefined check; the resulting
 * `User | undefined` carries the same "may be absent" contract.
 */
export const UserService = {
   getUserWithAuthorities(): User | undefined {
      const username = getCurrentUsername();
      return username === undefined ? undefined : UserRepository.findOneWithAuthoritiesByUsername(username);
   },
};
