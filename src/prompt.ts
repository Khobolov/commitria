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

export interface TicketingPromptOptions {
  diff: string;
  ticketId: string;
  title: string;
  previousCommits: string[];
}

export function buildTicketingPrompt(options: TicketingPromptOptions): string {
  const { diff, ticketId, title, previousCommits } = options;

  let prompt = `
Write a commit description for the following git diff.

The commit title is already defined as:
${ticketId}: ${title}

Rules:
- Output ONLY the description body (no title line, no code fences, no extra commentary).
- Describe what changed and why, wrapped at ~72 chars.
- Use bullet points if multiple changes are involved.
`;

  if (previousCommits.length > 0) {
    prompt += `
Previous commits on this branch (for context):
${previousCommits.map((c) => `- ${c}`).join("\n")}
`;
  }

  prompt += `
Diff:
${diff}
`;

  return prompt.trim();
}
