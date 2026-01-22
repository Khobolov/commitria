export function buildCommitPrompt(diff: { content: string }): string {
  return `
Write ONE Conventional Commit message for the following staged git diff.

Rules:
- Output ONLY the commit message (no code fences, no extra commentary).
- Use format: type(scope): summary
- Add an optional body if it helps, wrapped at ~72 chars.

Diff:
${diff.content}
`.trim();
}
