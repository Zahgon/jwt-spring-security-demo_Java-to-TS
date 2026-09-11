import { Authority } from './authority.entity';

/**
 * Port of the `USER` entity.
 *
 * `id`, `password` and `activated` carry `@JsonIgnore` in the original, so `toJSON` omits them;
 * the remaining field order reproduces the declaration order Jackson serialises in.
 */
export class User {
   id?: number;
   username!: string;
   password!: string;
   firstname!: string;
   lastname!: string;
   email!: string;
   activated = false;
   authorities: Authority[] = [];

   getId(): number | undefined {
      return this.id;
   }

   setId(id: number): void {
      this.id = id;
   }

   getUsername(): string {
      return this.username;
   }

   setUsername(username: string): void {
      this.username = username;
   }

   getPassword(): string {
      return this.password;
   }

   setPassword(password: string): void {
      this.password = password;
   }

   getFirstname(): string {
      return this.firstname;
   }

   setFirstname(firstname: string): void {
      this.firstname = firstname;
   }

   getLastname(): string {
      return this.lastname;
   }

   setLastname(lastname: string): void {
      this.lastname = lastname;
   }

   getEmail(): string {
      return this.email;
   }

   setEmail(email: string): void {
      this.email = email;
   }

   isActivated(): boolean {
      return this.activated;
   }

   setActivated(activated: boolean): void {
      this.activated = activated;
   }

   getAuthorities(): Authority[] {
      return this.authorities;
   }

   setAuthorities(authorities: Authority[]): void {
      this.authorities = authorities;
   }

   equals(other: unknown): boolean {
      if (this === other) return true;
      if (!(other instanceof User)) return false;
      return this.id === other.id;
   }

   toString(): string {
      return (
         `User{username='${this.username}', password='${this.password}', ` +
         `firstname='${this.firstname}', lastname='${this.lastname}', ` +
         `email='${this.email}', activated=${this.activated}}`
      );
   }

   toJSON(): Record<string, unknown> {
      return {
         username: this.username,
         firstname: this.firstname,
         lastname: this.lastname,
         email: this.email,
         authorities: this.authorities,
      };
   }
}
