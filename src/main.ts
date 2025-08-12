import { Application } from "./presentation/Application"

const app = new Application()
const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 5000

app.start(port)
