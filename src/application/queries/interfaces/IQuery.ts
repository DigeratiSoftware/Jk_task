// Base query interface
export interface IQuery {
  readonly timestamp: Date
  readonly correlationId: string
}

// Base query result
export interface IQueryResult<T = any> {
  data: T
  metadata?: any
}

// Query handler interface
export interface IQueryHandler<TQuery extends IQuery, TResult extends IQueryResult> {
  handle(query: TQuery): Promise<TResult>
}
