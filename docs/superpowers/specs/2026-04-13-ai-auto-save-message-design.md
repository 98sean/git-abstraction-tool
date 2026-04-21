# AI Connection And Auto Save Message Design

## Summary

This spec defines the first AI-enabled slice for Git Abstraction Tool:

- Add a global AI connection for either `OpenAI` or `Anthropic`
- Add a per-project AI settings panel
- Generate a plain-language save message from the currently staged diff
- Keep save flow safe by falling back to manual input when AI is slow or fails

This is intentionally scoped to the smallest useful AI feature for non-developers and junior developers. It does not include chat, usage dashboards, natural-language restore, or conflict resolution.

## Product Goal

When a user clicks `Save Progress`, the app should be able to suggest a clear, human-friendly save message such as:

> Changed the homepage background color and fixed typos in the contact form.

The user should only need to review or lightly edit that suggestion before saving.

## Target Users

- Vibe coders
- Junior developers
- Non-technical users tracking creative or website work in personal repositories

The product target for this slice is personal repositories, not enterprise or organization-heavy workflows.

## Scope

### In Scope

- One global AI provider connection at a time
- Supported providers: `OpenAI`, `Anthropic`
- Secure API key storage in OS-backed encrypted storage
- Per-project AI settings panel
- First-use per-project consent before sending diffs to AI
- Auto-generation of save messages from staged diff input
- 3-5 second timeout before falling back to manual input
- Basic model selection for the currently connected provider

### Out Of Scope

- Using both OpenAI and Anthropic at the same time
- Token usage dashboard
- Token-savings estimation UI
- Full `graphify` integration or knowledge graph generation
- AI chat interface
- Natural-language restore
- Smart conflict resolution
- Weekly changelog generation
- Organization or GitHub App based AI account management

## Key Decisions

### Provider Model

- The app stores exactly one active AI provider connection globally.
- The user may connect either `OpenAI` or `Anthropic`.
- Switching providers requires removing the current key and connecting the other provider.
- Projects do not choose their own provider. They use the current global provider.

### Project Consent Model

- AI diff transmission requires explicit consent per project.
- Consent is not asked at project-link time.
- Consent is asked only when the user first attempts to use AI save message generation for that project.
- After consent, the project stores that state and exposes it in project settings.

### Save UX Model

- The user clicks `Save Progress`.
- If AI is unavailable, disabled, or not consented, the current manual save flow continues.
- If AI is enabled and consented, the app attempts to generate a message.
- If generation succeeds quickly, the generated text is inserted into the existing message input.
- The user may edit it and click `Save Progress` again to actually commit.
- If generation fails or times out, the app does not block saving. The user stays in the manual input flow.

### Prompt Input Strategy

The app does not send whole project files by default.

Instead it sends:

- Staged diff only
- File paths
- Change types (`new`, `modified`, `deleted`, `renamed`)
- Small local structural hints when useful, such as component names, function names, selectors, or markdown headings

This uses `graphify`-inspired ideas only:

- incremental processing
- lightweight structural summaries
- future caching hooks

It does not add graph building, Python-based graph pipelines, or persistent knowledge graph artifacts in V1.

## User Experience

### Global AI Connection

Add an app-level AI connection screen or section where the user can:

- see whether AI is connected
- see the current provider
- connect one provider
- disconnect and switch providers
- choose a model from the validated model list for the connected provider

The UI must make it clear that only one provider can be active at once.

### Project Settings Panel

Each project gets its own settings panel with:

- `Use AI auto save messages`
- `Allow this project's staged diff to be sent to AI`
- `Selected model` for the currently connected provider
- provider status summary inherited from global app connection

Provider selection is not shown here because only one provider can be connected globally.

### Save Flow

### Case 1: AI unavailable

- No connected provider
- Feature disabled for project
- Consent not granted
- Validation failed

Result:

- Show the existing manual message input
- Keep existing commit flow unchanged

### Case 2: First AI use for a project

- User clicks `Save Progress`
- App detects no project consent
- App opens a lightweight consent prompt
- If accepted, proceed with generation
- If declined, keep manual save flow

### Case 3: AI generation succeeds

- App shows loading state in the save panel
- Generated message is inserted into the existing text area
- User reviews or edits
- User confirms by clicking `Save Progress` again

### Case 4: AI generation fails or times out

- App shows a short toast or inline error
- Text area remains editable
- User enters message manually

## Architecture

### Main Process

Add an AI service layer in the Electron main process that is responsible for:

- provider key storage and retrieval
- provider validation
- model listing
- prompt construction
- diff extraction helpers
- provider API calls
- sanitised error mapping

This keeps secrets and network requests out of the renderer, following the same security boundary used for GitHub credentials.

### Renderer

The renderer is responsible for:

- AI connection UI
- project settings UI
- consent prompt UI
- save-panel loading and fallback states
- presenting generated message text in the existing input field

## Data Model

### Global AI Connection State

Stored separately from normal project data:

- `provider`: `openai | anthropic | null`
- `encrypted_api_key`: secure storage only
- `selected_model`: string or null
- `available_models`: cached list
- `last_verified_at`: timestamp or null
- `connection_status`: `connected | invalid | disconnected`

### Project AI Settings

Stored with project settings or a dedicated settings store:

- `auto_save_message_enabled`: boolean
- `ai_diff_consent_granted`: boolean
- `ai_diff_consent_granted_at`: timestamp or null

## IPC Contract Additions

Expected new IPC surfaces:

- get AI connection status
- connect provider
- disconnect provider
- validate provider and fetch models
- get project AI settings
- update project AI settings
- generate auto save message

## Prompt And Generation Rules

The prompt should explicitly produce:

- one short human-readable sentence
- no Git jargon
- no file path dumps unless necessary
- no markdown bullets
- no fabricated behavior

Good output examples:

- `Updated the portfolio homepage layout and fixed text spacing issues.`
- `Added a new contact section and corrected typos in the footer.`

Bad output examples:

- `feat: modify Home.tsx and styles.css`
- `Refactored several files`

## Error Handling

- AI must never be required to save a commit
- Timeout after roughly 3-5 seconds
- Provider errors should map to user-safe messages
- Invalid or expired keys should mark connection state invalid
- Raw diffs and keys must never be logged
- Empty or low-quality AI responses should be discarded rather than auto-filled

## Security And Privacy

- Keep API keys only in OS-backed encrypted storage
- Keep provider calls in the main process
- Require per-project consent before sending diffs
- Never send whole repositories by default
- Avoid persistent storage of raw diff payloads
- Do not log secrets, prompts, or provider responses unless explicitly redacted

## Existing Code Areas Likely To Change

- `src/main/db/credentials.ts`
- `src/main/ipc/auth.ts`
- `src/main/git/service.ts`
- `src/main/ipc/index.ts`
- `src/renderer/src/components/ActionPanel/ActionPanel.tsx`
- `src/renderer/src/App.tsx`
- `src/renderer/src/types.ts`

Additional new files are expected for:

- AI service implementation
- provider adapters
- project settings persistence
- renderer hooks for AI connection and generation state
- project settings UI

## Testing Strategy

### Main Process Tests

- provider validation success and failure
- model list loading
- prompt payload construction from staged diff
- timeout handling
- invalid response handling

### Renderer Tests

- first-use consent flow
- AI loading state in save panel
- generated text insertion into the existing text area
- fallback to manual input on timeout or provider error
- project settings toggles

### Integration Tests

- connected provider + enabled project + successful generation
- no provider connected
- consent declined
- provider switched
- invalid key after previous success

## Performance Notes

V1 does not require heavy optimisation up front.

Start with:

- staged diff only
- minimal local structure extraction
- strict timeout

Potential later optimisations:

- file hash cache for repeated summarisation
- debounce for repeated generation attempts
- prompt compression telemetry
- estimated token savings against a defined baseline

## Backlog After V1

- token usage dashboard
- estimated token savings UI
- project glossary for domain-specific wording
- weekly changelog generator
- natural-language restore
- conflict explainer and AI-assisted merge suggestions
- sensitive-file upload warnings

## Non-Goals For This Spec

This spec does not change GitHub auth architecture, does not introduce a backend service, and does not attempt to make AI mandatory for core save behavior.
