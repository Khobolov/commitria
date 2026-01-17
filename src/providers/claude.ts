import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import type { Provider, ProviderResult } from "./types.js";

export class ClaudeProvider implements Provider {
  name = "claude";

  isAvailable(): boolean {
    try {
      execSync("claude --version", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  generate(prompt: string): Promise<ProviderResult> {
    return new Promise((resolve) => {
      const child = spawn("claude", ["-p"], {
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

      child.stdin.write(prompt);
      child.stdin.end();

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
            error: "No output from Claude",
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
