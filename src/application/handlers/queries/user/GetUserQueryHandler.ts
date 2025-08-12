import type { IQueryHandler } from "../../queries/interfaces/IQuery"
import type { GetUserQuery, GetUserQueryResult } from "../../queries/user/GetUserQuery"
import type { IUserRepository } from "../../../domain/interfaces/repositories/IUserRepository"
import { UserNotFoundException } from "../../../domain/exceptions/DomainException"

export class GetUserQueryHandler implements IQueryHandler<GetUserQuery, GetUserQueryResult> {
  constructor(private userRepository: IUserRepository) {}

  async handle(query: GetUserQuery): Promise<GetUserQueryResult> {
    const user = await this.userRepository.findById(query.userId)
    if (!user) {
      throw new UserNotFoundException(query.userId)
    }

    return {
      data: user,
    }
  }
}
