import type { ICommand, ICommandHandler, ICommandResult } from "../commands/interfaces/ICommand"

export class CommandBus {
  private handlers = new Map<string, ICommandHandler<any, any>>()

  register<TCommand extends ICommand, TResult extends ICommandResult>(
    commandType: new (...args: any[]) => TCommand,
    handler: ICommandHandler<TCommand, TResult>,
  ): void {
    this.handlers.set(commandType.name, handler)
  }

  async execute<TCommand extends ICommand, TResult extends ICommandResult>(command: TCommand): Promise<TResult> {
    const commandName = command.constructor.name
    const handler = this.handlers.get(commandName)

    if (!handler) {
      throw new Error(`No handler registered for command: ${commandName}`)
    }

    console.log(`Executing command: ${commandName}`, {
      correlationId: command.correlationId,
      timestamp: command.timestamp,
    })

    try {
      const result = await handler.handle(command)

      console.log(`Command executed successfully: ${commandName}`, {
        correlationId: command.correlationId,
        success: result.success,
      })

      return result
    } catch (error) {
      console.error(`Command execution failed: ${commandName}`, {
        correlationId: command.correlationId,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      throw error
    }
  }
}
