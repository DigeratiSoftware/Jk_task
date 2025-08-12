// Dependency Injection Container using the Service Locator pattern
export class DIContainer {
  private services = new Map<string, any>()
  private singletons = new Map<string, any>()

  register<T>(name: string, factory: () => T, singleton = false): void {
    if (singleton) {
      this.singletons.set(name, factory)
    } else {
      this.services.set(name, factory)
    }
  }

  resolve<T>(name: string): T {
    if (this.singletons.has(name)) {
      const factory = this.singletons.get(name)
      if (typeof factory === "function") {
        const instance = factory()
        this.singletons.set(name, instance) // Replace factory with instance
        return instance
      }
      return factory
    }

    const factory = this.services.get(name)
    if (!factory) {
      throw new Error(`Service ${name} not found`)
    }

    return factory()
  }

  registerInstance<T>(name: string, instance: T): void {
    this.singletons.set(name, instance)
  }
}

// Global container instance
export const container = new DIContainer()
