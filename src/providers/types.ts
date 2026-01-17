export interface ProviderResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
}

export interface Provider {
  name: string;
  isAvailable(): boolean;
  generate(prompt: string): Promise<ProviderResult>;
}
