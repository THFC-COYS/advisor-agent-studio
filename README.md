# Advisor Agent Studio

The Financial Advisor edition of the Studio line: a single-page studio where an independent financial advisor or small wealth practice designs a governed Muse chief of staff agent, and leaves with one copy-ready package to paste into Muse.

Live siblings: Owner Agent Studio, CourseAgent Studio, Manager Agent Studio, Realtor Agent Studio, and Muse Switch Kit. This edition follows the same architecture: one `index.html`, a pure `agent-core` script block (no DOM access) that the browser runs and the Node harness asserts, localStorage autosave on the user's device only, no dependencies, no backend.

## Who it is for

Independent financial advisors and small wealth practices. The advisor enters their name, their practice name, and a "who I serve" line (their client niche); all three land in the agent's identity and package.

## The flow

1. **Find.** A time-and-energy audit of advisor routines in four groups: Client meetings, Reviews and reporting, Practice operations, and Content and education. Each routine takes a time chip (None, Under 1 hr, 1 to 2 hrs, 3 to 4 hrs, 5+ hrs) and a feel chip (Fine, Tedious, Dread it). Score is hours x drain multiplier x agent fit. The reclaim figure uses a conservative 60 percent planning rate and is labeled an estimate everywhere it appears.
2. **The Stack.** Ranked opportunities map onto four toggleable modules, defaulted from the top audit scores: **Meeting Prep Partner**, **Review and Reporting**, **Practice Operations**, and **Client Education Content**. Every module job is phrased as preparation, never advice.
3. **Soul.** The advisor names the agent (a never-empty fallback applies), edits a guided identity statement ("You are NAME, chief of staff to ADVISOR, a financial advisor serving NICHE: ..."), picks bearings (precise, calm, discreet, thorough, warm) and values (accuracy over speed, the client's interest is the practice's interest, show every source, flag what is missing, protect client privacy absolutely), adds never-do presets plus free-text rules that ship verbatim, and approves or edits a generated voice sample line that ships word for word.
4. **Approvals and brief.** A conservative approval matrix, an accountable-owner gate (**no owner, no agent**), and the final package in three sections: **SECTION 1: WHO YOUR AGENT IS**, **SECTION 2: WHAT YOUR AGENT DOES** (system prompt, stack, and a sample first task output), **SECTION 3: WHERE YOU STAY IN CHARGE**. Copy and Download buttons included.

## The compliance spine

This edition's reason to exist: **the agent prepares, the licensed advisor decides and delivers.** Five standing guardrails appear in Section 3 of every package regardless of chip selection, are repeated in the system prompt, and outrank the approval matrix:

- The agent never gives financial advice or recommendations, to the advisor's clients or anyone else; it drafts and prepares only, and every client-facing word is reviewed and delivered by the licensed advisor.
- Never invent or estimate performance figures, returns, projections, or market data; only use numbers the advisor supplies, cited to their source.
- Never ask for, store, or repeat client credentials, account numbers, or government IDs; if a user pastes them, the agent stops and flags it.
- Client information stays inside the task; nothing about one client is ever used with another.
- Suitability, recommendations, and anything resembling a financial plan remain the licensed advisor's alone; the agent flags, never fills, gaps in a client's picture.

The approval matrix is the strictest in the Studio line: **no row defaults to Runs freely.** Pure drafting (a client email, educational content) defaults to "Runs, then notifies me"; sending, packet preparation, CRM updates, and publishing all default to "Always ask first." The UI says why in one line: this practice runs on review. The owner section also carries a responsibility line: the agent's output is preparatory, and the advisor is responsible for all advice and client communications.

The sample first task output is a skeleton with explicit "advisor supplies the numbers" placeholders. The harness asserts it contains bracket placeholders and no digits at all, so no figure can sneak in as invented.

## Honesty notes

- Copy and paste into Muse is the bridge today; no Muse login or provisioning API exists yet, and the studio says so next to the package.
- The reclaim math is a conservative planning estimate (60 percent), labeled as such, not a promise.
- The studio runs entirely in the browser. Nothing typed is sent anywhere; work autosaves to localStorage on the device only.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server.

## Tests

```
node tests/harness.js
```

The harness extracts the `agent-core` block and asserts: catalog integrity, scoring and the 60 percent reclaim, a heavy-meeting profile ranking Meeting Prep Partner first, module toggling in Section 2, the three section headers in order, name/advisor/niche in the identity, verbatim never-do free text, all five compliance guardrails in Section 3 even with zero never-do chips selected, no matrix default of Runs freely, a placeholder-only sample with no digit-percent patterns, the edited voice sample shipping word for word, the owner gate, and zero em dashes in the generated output and the file.
