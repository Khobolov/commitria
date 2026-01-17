import type { Provider as ProviderType } from "../config.js";
import type { Provider } from "./types.js";
import { ClaudeProvider } from "./claude.js";
import { CodexProvider } from "./codex.js";

export type { Provider, ProviderResult } from "./types.js";

const providers: Record<ProviderType, Provider> = {
  claude: new ClaudeProvider(),
  codex: new CodexProvider(),
};

export function getProvider(name: ProviderType): Provider {
  return providers[name];
}

export function getAvailableProviders(): ProviderType[] {
  return (Object.keys(providers) as ProviderType[]).filter((name) =>
    providers[name].isAvailable()
  );
}
