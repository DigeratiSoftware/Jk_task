// Base command interface
export interface ICommand {
  readonly timestamp: Date
  readonly correlationId: string
}

// Base command result
export interface ICommandResult {
  success: boolean
  data?: any
  errors?: string[]
}

// Command handler interface
export interface ICommandHandler<TCommand extends ICommand, TResult extends ICommandResult> {
  handle(command: TCommand): Promise<TResult>
}
