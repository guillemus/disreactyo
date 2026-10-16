import { DurableObject } from "cloudflare:workers"
import { createApp } from "./app"
import { Store } from "./store"

export class Dashboard extends DurableObject<Env> {
  private app = createApp(new Store())

  override fetch(request: Request) {
    return this.app.fetch(request)
  }
}

export default {
  fetch(request, env) {
    return env.DASHBOARD.get(env.DASHBOARD.idFromName("main")).fetch(request)
  },
} satisfies ExportedHandler<Env>
