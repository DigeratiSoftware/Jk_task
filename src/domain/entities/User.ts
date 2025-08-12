export abstract class BaseEntity {
  protected _id?: string
  protected _createdAt?: Date
  protected _updatedAt?: Date

  constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id
    this._createdAt = createdAt
    this._updatedAt = updatedAt
  }

  get id(): string | undefined {
    return this._id
  }

  get createdAt(): Date | undefined {
    return this._createdAt
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt
  }
}

export enum UserRole {
  ADMIN = "admin",
  EDITOR = "editor",
  VIEWER = "viewer",
}

export class User extends BaseEntity {
  private _email: string
  private _firstName: string
  private _lastName: string
  private _role: UserRole
  private _passwordHash?: string

  constructor(
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole = UserRole.VIEWER,
    id?: string,
    passwordHash?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt)
    this._email = email
    this._firstName = firstName
    this._lastName = lastName
    this._role = role
    this._passwordHash = passwordHash
  }

  get email(): string {
    return this._email
  }

  get firstName(): string {
    return this._firstName
  }

  get lastName(): string {
    return this._lastName
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`
  }

  get role(): UserRole {
    return this._role
  }

  get passwordHash(): string | undefined {
    return this._passwordHash
  }

  hasRole(role: UserRole): boolean {
    return this._role === role
  }

  hasPermission(permission: string): boolean {
    const permissions = this.getPermissions()
    return permissions.includes(permission)
  }

  private getPermissions(): string[] {
    switch (this._role) {
      case UserRole.ADMIN:
        return ["read", "write", "delete", "manage_users", "manage_system"]
      case UserRole.EDITOR:
        return ["read", "write", "delete"]
      case UserRole.VIEWER:
        return ["read"]
      default:
        return []
    }
  }

  updateRole(newRole: UserRole): void {
    this._role = newRole
  }

  updateProfile(firstName: string, lastName: string): void {
    this._firstName = firstName
    this._lastName = lastName
  }

  toJSON(): any {
    return {
      id: this._id,
      email: this._email,
      firstName: this._firstName,
      lastName: this._lastName,
      role: this._role,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
