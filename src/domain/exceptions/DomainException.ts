export abstract class DomainException extends Error {
  abstract readonly code: string
  abstract readonly statusCode: number

  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class UserNotFoundException extends DomainException {
  readonly code = "USER_NOT_FOUND"
  readonly statusCode = 404

  constructor(identifier: string) {
    super(`User not found: ${identifier}`)
  }
}

export class DocumentNotFoundException extends DomainException {
  readonly code = "DOCUMENT_NOT_FOUND"
  readonly statusCode = 404

  constructor(id: string) {
    super(`Document not found: ${id}`)
  }
}

export class UnauthorizedException extends DomainException {
  readonly code = "UNAUTHORIZED"
  readonly statusCode = 401

  constructor(message = "Unauthorized access") {
    super(message)
  }
}

export class ForbiddenException extends DomainException {
  readonly code = "FORBIDDEN"
  readonly statusCode = 403

  constructor(message = "Insufficient permissions") {
    super(message)
  }
}

export class ValidationException extends DomainException {
  readonly code = "VALIDATION_ERROR"
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
  }
}

export class DocumentProcessingException extends DomainException {
  readonly code = "DOCUMENT_PROCESSING_ERROR"
  readonly statusCode = 500

  constructor(message: string) {
    super(message)
  }
}
