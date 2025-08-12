import mongoose, { Schema, type Document as MongoDocument } from "mongoose"
import type { IUserRepository } from "../../domain/interfaces/repositories/IUserRepository"
import { User, UserRole } from "../../domain/entities/User"
import bcrypt from "bcryptjs"

interface UserDocument extends MongoDocument {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  passwordHash: string
  comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.VIEWER },
    passwordHash: { type: String, required: true, minlength: 6 },
  },
  { timestamps: true },
)

userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash)
}

const UserModel = mongoose.model<UserDocument>("User", userSchema)

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const userDoc = await UserModel.findById(id)
    return userDoc ? this.toDomainEntity(userDoc) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const userDoc = await UserModel.findOne({ email })
    return userDoc ? this.toDomainEntity(userDoc) : null
  }

  async findAll(page: number, limit: number): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit
    const [userDocs, total] = await Promise.all([
      UserModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      UserModel.countDocuments(),
    ])

    return {
      users: userDocs.map((doc) => this.toDomainEntity(doc)),
      total,
    }
  }

  async create(user: User): Promise<User> {
    const userDoc = new UserModel({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      passwordHash: user.passwordHash,
    })

    const savedDoc = await userDoc.save()
    return this.toDomainEntity(savedDoc)
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const userDoc = await UserModel.findByIdAndUpdate(id, updates, { new: true })
    return userDoc ? this.toDomainEntity(userDoc) : null
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id)
    return !!result
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const userDocs = await UserModel.find({ role })
    return userDocs.map((doc) => this.toDomainEntity(doc))
  }

  async count(): Promise<number> {
    return UserModel.countDocuments()
  }

  private toDomainEntity(userDoc: UserDocument): User {
    return new User(
      userDoc.email,
      userDoc.firstName,
      userDoc.lastName,
      userDoc.role,
      userDoc._id.toString(),
      userDoc.passwordHash,
      userDoc.createdAt,
      userDoc.updatedAt,
    )
  }
}
