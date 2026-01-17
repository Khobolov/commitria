const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export class Spinner {
  private intervalId: NodeJS.Timeout | null = null;
  private frameIndex = 0;
  private message: string;

  constructor(message: string = "Loading") {
    this.message = message;
  }

  start(): void {
    if (this.intervalId) return;

    process.stdout.write("\x1B[?25l"); // Hide cursor

    this.intervalId = setInterval(() => {
      const frame = frames[this.frameIndex];
      process.stdout.write(`\r${frame} ${this.message}`);
      this.frameIndex = (this.frameIndex + 1) % frames.length;
    }, 80);
  }

  stop(finalMessage?: string): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    process.stdout.write("\r\x1B[K"); // Clear line
    process.stdout.write("\x1B[?25h"); // Show cursor

    if (finalMessage) {
      console.log(finalMessage);
    }
  }
}
