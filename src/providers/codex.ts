import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import type { Provider, ProviderResult } from "./types.js";

export class CodexProvider implements Provider {
  name = "codex";

  isAvailable(): boolean {
    try {
      // Check if OpenAI Codex CLI is installed
      execSync("codex --version", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  generate(prompt: string): Promise<ProviderResult> {
    return new Promise((resolve) => {
      const child = spawn("codex", ["-q", prompt], {
        shell: true,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("error", (err: Error) => {
        resolve({
          success: false,
          error: `Spawn error: ${err.message}`,
        });
      });

      child.on("close", (code: number | null) => {
        if (code !== 0) {
          resolve({
            success: false,
            error: stderr || stdout || "Unknown error",
            exitCode: code ?? 1,
          });
          return;
        }

        const output = stdout.trim();
        if (!output) {
          resolve({
            success: false,
            error: "No output from Codex",
          });
          return;
        }

        resolve({
          success: true,
          output,
        });
      });
    });
  }
}
