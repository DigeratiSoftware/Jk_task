import type { IQueryHandler } from "../../queries/interfaces/IQuery"
import type { GetUsersQuery, GetUsersQueryResult } from "../../queries/user/GetUsersQuery"
import type { IUserRepository } from "../../../domain/interfaces/repositories/IUserRepository"

export class GetUsersQueryHandler implements IQueryHandler<GetUsersQuery, GetUsersQueryResult> {
  constructor(private userRepository: IUserRepository) {}

  async handle(query: GetUsersQuery): Promise<GetUsersQueryResult> {
    // For now, we'll use the basic repository method
    // In a full CQRS implementation, we might have separate read models
    const result = await this.userRepository.findAll(query.page, query.limit)

    // Apply additional filtering if needed
    let filteredUsers = result.users

    if (query.role) {
      filteredUsers = filteredUsers.filter((user) => user.role === query.role)
    }

    if (query.searchTerm) {
      const searchLower = query.searchTerm.toLowerCase()
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower),
      )
    }

    return {
      data: {
        users: filteredUsers,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: filteredUsers.length,
          pages: Math.ceil(filteredUsers.length / query.limit),
        },
      },
    }
  }
}
