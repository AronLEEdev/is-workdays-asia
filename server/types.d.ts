import type { ApiKeyRow } from "./utils/validateApiKey";

declare module "h3" {
  interface H3EventContext {
    apiKey: ApiKeyRow;
  }
}
