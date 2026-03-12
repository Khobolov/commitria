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
- Use bullet points starting with "- " for each change.
- Use short imperative phrases (e.g., "- add user avatar", "- fix card alignment", "- update color scheme").
- Do NOT use full sentences like "This commit will..." — just the action directly.
- Wrap lines at ~72 chars.
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
