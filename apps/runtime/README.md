# runtime

`runtime` is an [eve](https://eve.dev/docs) app in this monorepo.  
It runs a durable backend AI agent configured from files in the `agent/` directory.

## Project structure

```text
apps/runtime/
├── agent/
│   ├── agent.ts
│   ├── instructions.md                # Base system prompt + customer profile workflow
│   ├── channels/
│   │   ├── eve.ts                     # Core Eve HTTP channel auth config
│   │   ├── telegram.ts                # Telegram channel webhook integration
│   │   ├── twilio.ts                  # Twilio SMS/voice channel integration
│   │   ├── resend.ts                  # Resend chat-sdk channel integration
│   │   ├── whatsapp.ts                # WhatsApp chat-sdk channel integration
│   │   ├── messenger.ts               # Messenger chat-sdk channel integration
│   │   ├── slack.ts                   # Slack channel integration
│   │   └── discord.ts                 # Discord channel integration
│   ├── tools/
│   │   ├── get_customer_status.ts     # Channel-aware customer profile status
│   │   ├── set_customer_name.ts       # Save customer name via HITL flow
│   │   ├── set_customer_phone.ts      # Save customer phone via HITL flow
│   │   ├── search_knowledge.ts        # Tenant-scoped semantic knowledge search
│   │   └── list_knowledge_sources.ts  # List tenant knowledge sources + statuses
│   ├── lib/
│   │   ├── auth.ts                    # Better Auth resolver for Eve channel auth
│   │   ├── customers.ts               # Telegram customer bootstrap helper
│   │   ├── customer-profile-context.ts # Resolve supported channel + owner/user context
│   │   ├── channel-config.ts          # Shared channel display config
│   │   └── knowledge.ts               # Shared tenant knowledge ownership resolver
│   └── extensions/
│       └── agentkit.ts                # Upstash agentkit extension wiring
├── .env.example                       # Local env template (channels, auth, DB)
├── package.json                       # App scripts + deps
├── tsconfig.json                      # TypeScript config
├── AGENTS.md                          # Agent coding rules for this app
├── CLAUDE.md                          # Tooling hint file
├── .gitignore
└── .vercelignore
```

## What each current part does

- `agent/agent.ts`: main eve agent definition (model and core config).
- `agent/instructions.md`: base identity plus channel-aware customer profile collection flow.
- `agent/channels/`: all active channel integrations (Eve, Telegram, Twilio, Resend, WhatsApp, Messenger, Slack, Discord).
- `agent/tools/`: tools used by the model for customer profile collection and tenant knowledge lookup.
- `agent/lib/`: shared helper logic for auth, channel context resolution, and customer bootstrapping.
- `agent/extensions/agentkit.ts`: runtime extension wiring.
- `.env.example`: environment variable template for runtime system keys and non-tenant channel credentials.
- `package.json`: scripts and dependencies for the agent app.
- `AGENTS.md` and `CLAUDE.md`: assistant guidance files used by coding tools.

## Common Eve folders you can add

These are common folders you may add as this agent grows (beyond what already exists):

- `agent/subagents/`: specialized child agents for delegated tasks.
- `agent/skills/`: reusable behavior packs/prompts for specific domains.
- `agent/examples/`: reference prompts, payloads, and sample interactions.
- `agent/evals/`: evaluation cases and automated quality checks.
- `agent/schedules/`: cron-like scheduled jobs/tasks for background execution.
- `agent/connections/`: integration/auth wiring for external services.

Keep only folders you actually use; Eve is file-system driven, so adding these
incrementally is the normal workflow.

## Run with eve

From repo root:

```bash
bun run --filter runtime dev
```

From `apps/runtime`:

```bash
bun run dev
```

Available scripts:

- `bun run dev` - start eve in development mode.
- `bun run build` - build the agent.
- `bun run start` - run the built agent.
- `bun run typecheck` - run TypeScript checks.

## Notes

- This app uses the local `eve` package version from this workspace.
- Prefer reading version-matched docs from `node_modules/eve/docs/` first.
- Customer profile collection is currently enabled for Telegram + Twilio channels via `agent/tools/` and `agent/lib/customer-profile-context.ts`.
- Twilio and Telegram credentials are tenant-scoped and configured from the web app Settings page.
