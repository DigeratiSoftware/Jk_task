import { container } from "./DIContainer"
import { MongoUserRepository } from "../repositories/MongoUserRepository"
import { MongoDocumentRepository } from "../repositories/MongoDocumentRepository"
import { OpenAIEmbeddingService } from "../services/OpenAIEmbeddingService"
import { DocumentProcessorFactory } from "../services/DocumentProcessorFactory"
import { JWTAuthService } from "../services/JWTAuthService"
import { UserService } from "../../application/services/UserService"
import { DocumentService } from "../../application/services/DocumentService"
import { QAService } from "../../application/services/QAService"
import { RAGService } from "../../application/services/RAGService"

export function registerServices() {
  // Infrastructure services (singletons)
  container.register("UserRepository", () => new MongoUserRepository(), true)
  container.register("DocumentRepository", () => new MongoDocumentRepository(), true)
  container.register(
    "EmbeddingService",
    () => new OpenAIEmbeddingService(process.env.OPENAI_API_KEY || "your-openai-api-key"),
    true,
  )
  container.register("DocumentProcessorFactory", () => new DocumentProcessorFactory(), true)

  // Auth service
  container.register(
    "AuthService",
    () => new JWTAuthService(container.resolve("UserRepository"), process.env.JWT_SECRET || "fallback-secret"),
    true,
  )

  // Application services
  container.register(
    "UserService",
    () => new UserService(container.resolve("UserRepository"), container.resolve("AuthService")),
  )

  container.register(
    "DocumentService",
    () =>
      new DocumentService(
        container.resolve("DocumentRepository"),
        container.resolve("EmbeddingService"),
        container.resolve("DocumentProcessorFactory"),
      ),
  )

  container.register(
    "RAGService",
    () =>
      new RAGService(
        container.resolve("DocumentRepository"),
        container.resolve("EmbeddingService"),
        process.env.OPENAI_API_KEY || "your-openai-api-key",
      ),
  )

  container.register(
    "QAService",
    () =>
      new QAService(
        container.resolve("QASessionRepository"),
        container.resolve("DocumentRepository"),
        container.resolve("RAGService"),
      ),
  )
}
