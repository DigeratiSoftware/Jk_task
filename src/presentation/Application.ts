import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import mongoose from "mongoose"
import { registerServices } from "../infrastructure/config/ServiceRegistration"
import { registerCQRSServices } from "../infrastructure/config/CQRSServiceRegistration"
import { CQRSUserRoutes } from "./routes/CQRSUserRoutes"
import { DomainException } from "../domain/exceptions/DomainException"

export class Application {
  private app: express.Application
  private cqrsUserRoutes: CQRSUserRoutes

  constructor() {
    this.app = express()
    this.cqrsUserRoutes = new CQRSUserRoutes()

    this.initializeDatabase()
    this.initializeMiddleware()
    this.initializeRoutes()
    this.initializeErrorHandling()
    this.registerDependencies()
  }

  private async initializeDatabase(): Promise<void> {
    try {
      const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/document-rag-app"
      await mongoose.connect(mongoURI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      console.log("MongoDB connected successfully")
    } catch (error) {
      console.error("MongoDB connection error:", error)
      process.exit(1)
    }
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet())
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
      }),
    )

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again later.",
    })
    this.app.use(limiter)

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }))
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }))
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({ status: "OK", timestamp: new Date().toISOString() })
    })

    // CQRS API routes
    this.app.use("/api/v2/auth", this.cqrsUserRoutes.getRouter())
    this.app.use("/api/v2/users", this.cqrsUserRoutes.getRouter())
  }

  private initializeErrorHandling(): void {
    // Domain exception handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error("Error:", err)

      if (err instanceof DomainException) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          code: err.code,
        })
      }

      if (err.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: Object.values(err.errors).map((e: any) => e.message),
        })
      }

      if (err.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format",
        })
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    })

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
      })
    })
  }

  private registerDependencies(): void {
    registerServices()
    registerCQRSServices()
  }

  public start(port = 5000): void {
    this.app.listen(port, () => {
      console.log(`Server running on port ${port}`)
      console.log("CQRS pattern implemented with separate command and query responsibilities")
    })
  }

  public getApp(): express.Application {
    return this.app
  }
}
