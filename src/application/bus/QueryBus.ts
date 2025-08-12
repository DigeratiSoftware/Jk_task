import type { IQuery, IQueryHandler, IQueryResult } from "../queries/interfaces/IQuery"

export class QueryBus {
  private handlers = new Map<string, IQueryHandler<any, any>>()

  register<TQuery extends IQuery, TResult extends IQueryResult>(
    queryType: new (...args: any[]) => TQuery,
    handler: IQueryHandler<TQuery, TResult>,
  ): void {
    this.handlers.set(queryType.name, handler)
  }

  async execute<TQuery extends IQuery, TResult extends IQueryResult>(query: TQuery): Promise<TResult> {
    const queryName = query.constructor.name
    const handler = this.handlers.get(queryName)

    if (!handler) {
      throw new Error(`No handler registered for query: ${queryName}`)
    }

    console.log(`Executing query: ${queryName}`, {
      correlationId: query.correlationId,
      timestamp: query.timestamp,
    })

    try {
      const result = await handler.handle(query)

      console.log(`Query executed successfully: ${queryName}`, {
        correlationId: query.correlationId,
      })

      return result
    } catch (error) {
      console.error(`Query execution failed: ${queryName}`, {
        correlationId: query.correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      throw error
    }
  }
}
