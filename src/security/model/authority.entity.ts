/** Port of the `AUTHORITY` entity. */
export class Authority {
   name!: string;

   constructor(name?: string) {
      if (name !== undefined) {
         this.name = name;
      }
   }

   getName(): string {
      return this.name;
   }

   setName(name: string): void {
      this.name = name;
   }

   equals(other: unknown): boolean {
      if (this === other) return true;
      if (!(other instanceof Authority)) return false;
      return this.name === other.name;
   }

   toString(): string {
      return `Authority{name=${this.name}}`;
   }

   /**
    * `@JsonIgnore` is absent on this entity, so the whole (single-field) authority is
    * serialised — that is why `/api/user` returns `[ { "name": "ROLE_USER" } ]` rather than
    * a bare array of strings.
    */
   toJSON(): { name: string } {
      return { name: this.name };
   }
}
