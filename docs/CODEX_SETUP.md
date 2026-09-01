# Codex setup

This repository is ready to use from Codex CLI or Codex in the ChatGPT desktop app.

## Terminal

Install or update Codex CLI using the official Codex instructions, then sign in with your ChatGPT account. Start it at the repository root so it discovers `AGENTS.md`:

```bash
cd "/Users/dhruvkapur/Documents/Personal Projects/SkiApp"
codex
```

Use `/status` to confirm the workspace, permissions, and active model. Use `/init` only when a repository does not already have an `AGENTS.md`; this one does.

## ChatGPT desktop app

Install and sign in to the ChatGPT desktop app, select **Codex**, and open the SkiApp folder as a local project. The app and CLI share Codex configuration, and each new Codex session automatically reads the checked-in `AGENTS.md`.

Official references:

- <https://learn.chatgpt.com/docs/app>
- <https://learn.chatgpt.com/docs/codex/cli>
- <https://learn.chatgpt.com/docs/agent-configuration/agents-md>
- <https://learn.chatgpt.com/docs/environments/local-environment>

## Local environment actions

In the desktop app, open the local-environment settings for this project. Keep setup and actions scoped to `backend/`.

Setup script:

```bash
cd backend
npm ci
```

Recommended actions:

| Action | Command |
| --- | --- |
| Run API | `cd backend && npm run dev` |
| Check | `cd backend && npm run check` |
| Test | `cd backend && npm test` |
| Build | `cd backend && npm run build` |

Local-environment settings are created through the desktop app. If the app offers to save the generated `.codex` configuration in this repository, review it before committing so it contains portable commands and no machine-specific secrets.

## Prompt pattern

For implementation tasks, include:

- Goal: the user-visible outcome.
- Context: relevant files, behavior, and provider constraints.
- Constraints: architecture, compatibility, budget, or data licensing limits.
- Done when: tests and observable acceptance criteria.

Ask Codex to run `cd backend && npm run check` and review the diff before considering a backend task complete.
