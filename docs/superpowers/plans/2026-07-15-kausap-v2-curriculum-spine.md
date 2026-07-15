# Kausap v2 — Syllabus-Aware Scenes Implementation Plan (spec v1.1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a curriculum spine that owns grammar sequencing, and make both consumers — the voice-scene instruction builder and the hang-up feedback grader — read from it (TAGALOG-PLAY.md v1.1 Part B).

**Architecture:** A static, original-content curriculum (`lib/curriculum.ts`) defines ordered units with grammar targets and per-unit **scene seeds**. Learner state (current unit, SRS boxes, error ledger keyed by patternTag, session log, last-used seed) lives in localStorage beside the existing `kausap.sessions`/`kausap.vocab` stores (D2 reconciliation: all persistence in this app is client-side; API routes stay stateless; the client sends curriculum context per request — reported to Will, accepted for single-device v2). The session route appends curriculum blocks (elicitation goals, **soft** scope preference, recycling, error focus) after the existing scenario instructions, never modifying them. Corrections get `patternTag`s in the existing `/api/feedback` call (D5 — the report IS the structured judgment step). gpt-5-mini (existing `FEEDBACK_MODEL`) powers all text-brain work.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind 4, OpenAI Realtime API over WebRTC (voice), env-driven Azure Foundry/OpenAI chat completions via `lib/openai-server.ts` (text), localStorage persistence, vitest (new) for pure-logic tests.

## Global Constraints

- **INVARIANTS (regression guards, spec v1.1):** the accent spec, recast-only correction rules, Taglish-is-never-an-error policy, and lifeline behavior in `lib/scenarios.ts` `buildInstructions()` remain **byte-identical**. No task modifies `lib/scenarios.ts`. Curriculum blocks are appended after `buildInstructions()` output only. Task 12 diff-verifies this. Provider plumbing (`lib/openai-server.ts`) unchanged.
- **Original content only.** Never ingest or reproduce any published textbook's text, dialogues, or exercises (Part A §5). All curriculum content in this plan is freshly authored.
- **Units strictly ordered**; `recycleFrom` mandatory for u03+; every grammar target has ≥2 freshly authored example frames; every unit has **≥2 scene seeds** engineered so the unit's grammar is the natural way to complete the scene's tasks (D1).
- **Scope is a soft preference, not a contract** (D3.2): voice roleplay steers toward acquired grammar; it never hard-gates.
- **Controlled patternTag vocabulary** = curriculum grammar-target ids + exactly this general taxonomy (D5): `g-ang-ng-confusion`, `g-aspect`, `g-enclitic-order`, `g-word-order`, `g-vocab`.
- **Code-switching is NEVER an error and never tagged** — restated inside the feedback schema prompt (D5) and fixture-tested (acceptance 2).
- Modes (D4): `target` (M1 Target Scene, default daily, seed-driven, per-target 0–100 scores), `free` (M2), `review` (M3 voice game scene). M4 Lia Prep is text. M3 voice-first per D4; text-first variant is an open decision for Will, not built now.
- Scene seeds rotate; never repeat the last-used seed (D3).
- Priorities: P0 = Tasks 1–8 (D1–D3, D5). P1 = Tasks 9–10 (D4 review/Lia Prep, D6 gate). P2 = Task 11 (D7). Task 12 = acceptance.
- Existing scenarios and the Taglish dial keep working unchanged when curriculum features are ignored (mode defaults to `free`, no seed).
- Server routes validate client input: mode enum, unit/seed ids must exist, arrays and strings capped exactly as written.
- After any change, `npx tsc --noEmit` and `npx vitest run` must pass before committing. Commit after every task with the exact message given (append this repo's standard Claude trailers).

---

### Task 1: Test infrastructure (vitest)

**Files:**
- Modify: `package.json` (devDependencies + `test` script)
- Create: `vitest.config.ts`
- Create: `lib/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: `npx vitest run` command used by all later tasks; `@/` path alias resolves inside tests.

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest`
Expected: exit 0, `vitest` in `package.json` devDependencies.

- [ ] **Step 2: Create vitest config with the `@/` alias**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

In `package.json` `"scripts"`, add: `"test": "vitest run"`

- [ ] **Step 4: Write a smoke test that exercises the alias**

```ts
// lib/__tests__/smoke.test.ts
import { describe, it, expect } from "vitest";
import { getScenario } from "@/lib/scenarios";

describe("test infra", () => {
  it("resolves @/ alias and runs", () => {
    expect(getScenario("cooking")?.id).toBe("cooking");
  });
});
```

- [ ] **Step 5: Run tests, verify pass**

Run: `npx vitest run`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/__tests__/smoke.test.ts
git commit -m "test: add vitest infrastructure with @/ alias"
```

---

### Task 2: Curriculum spine with scene seeds (`lib/curriculum.ts`)

**Files:**
- Create: `lib/curriculum.ts`
- Test: `lib/__tests__/curriculum.test.ts`

**Interfaces:**
- Consumes: `Scenario` interface from `lib/scenarios.ts` (read-only import of the type).
- Produces (consumed by Tasks 4–12):
  - `interface GrammarTarget { id: string; pattern: string; exampleFrames: string[] }`
  - `interface UnitVocab { tl: string; en: string; tags: string[] }`
  - `interface SceneSeed { id: string; persona: string; voice: string; setting: string; why: string; propsVocab: string[]; opening: string }` — `persona`/`voice`/`opening` are app-side extensions of the spec's seed schema (voice scenes need a character and a first line; flagged as an extension, not a spec change)
  - `interface Unit { id: string; title: string; grammarTargets: GrammarTarget[]; vocab: UnitVocab[]; registerNotes: string[]; canDo: string[]; recycleFrom: string[]; sceneSeeds: SceneSeed[] }`
  - `CURRICULUM: Unit[]` (u01–u10, strictly ordered)
  - `GENERIC_PATTERN_TAGS = ["g-ang-ng-confusion","g-aspect","g-enclitic-order","g-word-order","g-vocab"]`
  - `getUnit(id: string): Unit | undefined`
  - `unitIndex(id: string): number` (0-based; -1 if unknown)
  - `acquiredUnits(currentUnitId: string): Unit[]` (u01..current inclusive)
  - `allowedPatternTags(currentUnitId: string): string[]` (acquired target ids + generic tags, deduped)
  - `defaultLevelForUnit(id: string): number` (Taglish-level curve; Will tunes)
  - `getSeed(seedId: string): { unit: Unit; seed: SceneSeed } | undefined`
  - `pickSeed(unitId: string, lastSeedId: string | null): SceneSeed | undefined` (deterministic rotation: next seed in order after lastSeedId; first seed if lastSeedId absent/unknown)
  - `seedToScenario(seed: SceneSeed, unit: Unit): Scenario` (builds a runtime Scenario the existing `buildInstructions()` consumes unchanged)
  - `validateCurriculum(units: Unit[]): string[]` (constraint violations; empty = valid)

- [ ] **Step 1: Write failing tests**

```ts
// lib/__tests__/curriculum.test.ts
import { describe, it, expect } from "vitest";
import {
  CURRICULUM, GENERIC_PATTERN_TAGS, getUnit, unitIndex, acquiredUnits,
  allowedPatternTags, defaultLevelForUnit, getSeed, pickSeed, seedToScenario,
  validateCurriculum,
} from "@/lib/curriculum";

describe("curriculum spine", () => {
  it("has 10 strictly ordered units u01..u10", () => {
    expect(CURRICULUM.map((u) => u.id)).toEqual(
      ["u01","u02","u03","u04","u05","u06","u07","u08","u09","u10"]
    );
  });

  it("passes its own validation", () => {
    expect(validateCurriculum(CURRICULUM)).toEqual([]);
  });

  it("validateCurriculum catches missing recycleFrom on u03+", () => {
    const broken = CURRICULUM.map((u) => (u.id === "u05" ? { ...u, recycleFrom: [] } : u));
    expect(validateCurriculum(broken).join(" ")).toContain("u05");
  });

  it("validateCurriculum catches a target with fewer than 2 example frames", () => {
    const broken = CURRICULUM.map((u) =>
      u.id === "u06"
        ? { ...u, grammarTargets: [{ ...u.grammarTargets[0], exampleFrames: ["one"] }] }
        : u
    );
    expect(validateCurriculum(broken).join(" ")).toContain("u06");
  });

  it("validateCurriculum catches a unit with fewer than 2 scene seeds", () => {
    const broken = CURRICULUM.map((u) =>
      u.id === "u04" ? { ...u, sceneSeeds: u.sceneSeeds.slice(0, 1) } : u
    );
    expect(validateCurriculum(broken).join(" ")).toContain("u04");
  });

  it("acquiredUnits(u03) returns u01..u03", () => {
    expect(acquiredUnits("u03").map((u) => u.id)).toEqual(["u01","u02","u03"]);
  });

  it("allowedPatternTags includes acquired target ids and generic tags, not future ones, deduped", () => {
    const tags = allowedPatternTags("u03");
    expect(tags).toContain("g-mag-aspect");        // u03 target
    expect(tags).toContain("g-ang-ng-confusion");  // generic
    expect(tags).not.toContain("g-in-aspect");     // u06 target — future
    expect(new Set(tags).size).toBe(tags.length);  // no duplicates
  });

  it("defaultLevelForUnit ramps 2 → 5", () => {
    expect(defaultLevelForUnit("u01")).toBe(2);
    expect(defaultLevelForUnit("u04")).toBe(3);
    expect(defaultLevelForUnit("u07")).toBe(4);
    expect(defaultLevelForUnit("u10")).toBe(5);
  });

  it("getSeed finds a seed with its unit", () => {
    const hit = getSeed("s-adobo");
    expect(hit?.unit.id).toBe("u06");
    expect(hit?.seed.id).toBe("s-adobo");
  });

  it("pickSeed rotates and never repeats the last-used seed", () => {
    const u06 = getUnit("u06")!;
    const first = pickSeed("u06", null)!;
    expect(first.id).toBe(u06.sceneSeeds[0].id);
    const second = pickSeed("u06", first.id)!;
    expect(second.id).not.toBe(first.id);
    // wraps around
    const last = u06.sceneSeeds[u06.sceneSeeds.length - 1];
    expect(pickSeed("u06", last.id)!.id).toBe(u06.sceneSeeds[0].id);
  });

  it("seedToScenario produces a Scenario shape buildInstructions can consume", () => {
    const { unit, seed } = getSeed("s-adobo")!;
    const sc = seedToScenario(seed, unit);
    expect(sc.id).toBe("s-adobo");
    expect(sc.scene).toContain(seed.setting);
    expect(sc.opening).toBe(seed.opening);
    expect(sc.voice).toBe(seed.voice);
  });

  it("getUnit and unitIndex behave for unknown ids", () => {
    expect(getUnit("u99")).toBeUndefined();
    expect(unitIndex("u99")).toBe(-1);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run lib/__tests__/curriculum.test.ts`
Expected: FAIL — cannot resolve `@/lib/curriculum`.

- [ ] **Step 3: Write `lib/curriculum.ts` with the full original 10-unit spine**

All content below is freshly authored for this app (constraint: no textbook text).

```ts
// lib/curriculum.ts
/**
 * The curriculum spine: ordered grammar units in acquisition order, each
 * with scene seeds engineered so the unit's grammar is the natural way to
 * complete the scene's tasks (the adobo scene is the reference pattern).
 * ORIGINAL CONTENT ONLY — never copy published textbook text, dialogues,
 * or exercises here (TAGALOG-PLAY.md A§5). Will maps unit numbers to his
 * physical textbook manually.
 */
import type { Scenario } from "./scenarios";

export interface GrammarTarget {
  id: string;
  pattern: string;
  exampleFrames: string[];
}

export interface UnitVocab {
  tl: string;
  en: string;
  tags: string[];
}

/**
 * Spec extension: persona/voice/opening added to the spec's seed schema —
 * a voice scene needs a character and a first line (learner never faces
 * dead air). Flagged in the plan; not a spec change.
 */
export interface SceneSeed {
  id: string;
  persona: string;
  voice: string;
  setting: string;
  why: string;
  propsVocab: string[];
  opening: string;
}

export interface Unit {
  id: string;
  title: string;
  grammarTargets: GrammarTarget[];
  vocab: UnitVocab[];
  registerNotes: string[];
  canDo: string[];
  recycleFrom: string[];
  sceneSeeds: SceneSeed[];
}

/** D5 controlled general taxonomy — exactly these five. */
export const GENERIC_PATTERN_TAGS = [
  "g-ang-ng-confusion",
  "g-aspect",
  "g-enclitic-order",
  "g-word-order",
  "g-vocab",
];

export const CURRICULUM: Unit[] = [
  {
    id: "u01",
    title: "Greetings, po/opo, and saying who you are",
    grammarTargets: [
      {
        id: "g-po-opo",
        pattern: "po/opo in second position for elders and respect",
        exampleFrames: ["Kumusta po kayo?", "Opo, kumain na po ako.", "Salamat po sa pagkain."],
      },
      {
        id: "g-pronoun-basics",
        pattern: "core pronouns ako/ikaw~ka/siya/kayo in greetings and introductions",
        exampleFrames: ["Ako si ___.", "Kumusta ka?", "Mabuti naman ako."],
      },
    ],
    vocab: [
      { tl: "kumusta", en: "how are (you)", tags: ["greeting"] },
      { tl: "mabuti", en: "fine / well", tags: ["greeting"] },
      { tl: "salamat", en: "thank you", tags: ["courtesy"] },
      { tl: "walang anuman", en: "you're welcome", tags: ["courtesy"] },
      { tl: "sige", en: "okay / go ahead", tags: ["courtesy"] },
      { tl: "paalam", en: "goodbye", tags: ["greeting"] },
    ],
    registerNotes: ["Use kayo + po with elders (Lola, Tita); ka without po with peers and kids."],
    canDo: ["Greet an elder with po and answer kumusta", "Introduce myself by name"],
    recycleFrom: [],
    sceneSeeds: [
      {
        id: "s-tawag-lola",
        persona: "the learner's Lola on a phone call from the province, warm, slightly hard of hearing",
        voice: "marin",
        setting: "a phone call to Lola just to say hello and check in",
        why: "greetings and kumusta exchanges force po/opo and pronoun basics on every turn",
        propsVocab: ["kumusta", "mabuti", "salamat"],
        opening: "Hello? Sino ito? Apo! Kumusta ka na, anak?",
      },
      {
        id: "s-bagong-kapitbahay",
        persona: "a friendly older Filipina neighbor meeting the learner at the gate for the first time",
        voice: "marin",
        setting: "meeting the new neighbor, Aling Nena, outside the house",
        why: "first meetings require self-introduction (Ako si ___) and polite po forms",
        propsVocab: ["kumusta", "sige", "paalam"],
        opening: "Uy, hello! Ikaw ba ang bagong kapitbahay? Ako si Aling Nena.",
      },
    ],
  },
  {
    id: "u02",
    title: "Family and identity: si/ang sentences",
    grammarTargets: [
      {
        id: "g-si-ang-identity",
        pattern: "identifying people/things: Si ___ ang ___ / Ito ang ___",
        exampleFrames: ["Si Lia ang asawa ko.", "Ito ang anak namin.", "Si Nanay ang nagluto."],
      },
      {
        id: "g-sino-ano-questions",
        pattern: "sino/ano questions with ang-phrases",
        exampleFrames: ["Sino ang kapatid mo?", "Ano ang pangalan ng anak mo?"],
      },
    ],
    vocab: [
      { tl: "asawa", en: "spouse", tags: ["family"] },
      { tl: "anak", en: "child (one's own)", tags: ["family"] },
      { tl: "kapatid", en: "sibling", tags: ["family"] },
      { tl: "magulang", en: "parent", tags: ["family"] },
      { tl: "pamilya", en: "family", tags: ["family"] },
      { tl: "pangalan", en: "name", tags: ["identity"] },
    ],
    registerNotes: ["Ate/Kuya before an older sibling's (or older peer's) name; never bare first name for elders."],
    canDo: ["Introduce my wife and kids by name and relation", "Ask who someone is in a family photo"],
    recycleFrom: [],
    sceneSeeds: [
      {
        id: "s-family-photos",
        persona: "the learner's Tita flipping through a family photo album with them over coffee",
        voice: "marin",
        setting: "looking through an old family photo album with Tita",
        why: "every photo demands 'Sino ang...?' questions and 'Si ___ ang ___' identifications",
        propsVocab: ["pamilya", "kapatid", "magulang"],
        opening: "Halika, tingnan natin itong lumang album. O, sino ito sa litrato?",
      },
      {
        id: "s-video-call-pinsan",
        persona: "the learner's cousin video-calling from Manila, curious about the learner's family abroad",
        voice: "coral",
        setting: "a video call with a cousin who wants to meet the whole family",
        why: "introducing people on camera forces si/ang identity sentences and family terms",
        propsVocab: ["asawa", "anak", "pangalan"],
        opening: "Uy pinsan! Ang tagal nating hindi nagkita! Sino-sino diyan sa bahay? Ipakilala mo naman sila.",
      },
    ],
  },
  {
    id: "u03",
    title: "Doing things: mag- verbs (actor focus)",
    grammarTargets: [
      {
        id: "g-mag-aspect",
        pattern: "mag- verb aspect: nag- (completed) / nag+CV (incompleted) / mag+CV (contemplated)",
        exampleFrames: ["Nagluto ako ng hapunan kagabi.", "Naglilinis siya tuwing Sabado.", "Magluluto tayo bukas."],
      },
      {
        id: "g-mag-imperative",
        pattern: "friendly commands and invitations with mag-",
        exampleFrames: ["Maglinis ka muna ng kusina.", "Mag-aral tayo mamaya."],
      },
    ],
    vocab: [
      { tl: "magluto", en: "to cook", tags: ["home"] },
      { tl: "maglinis", en: "to clean", tags: ["home"] },
      { tl: "magtrabaho", en: "to work", tags: ["work"] },
      { tl: "mag-aral", en: "to study", tags: ["school"] },
      { tl: "maglaro", en: "to play", tags: ["kids"] },
      { tl: "magbasa", en: "to read", tags: ["leisure"] },
    ],
    registerNotes: ["Soften commands to elders with po; nga and naman soften requests to anyone."],
    canDo: ["Say what I did yesterday and will do tomorrow with mag- verbs", "Invite the family to do something together"],
    recycleFrom: ["u01", "u02"],
    sceneSeeds: [
      {
        id: "s-linggo-plano",
        persona: "the learner's wife planning the family weekend over morning coffee",
        voice: "coral",
        setting: "Saturday-morning planning: who does what this weekend",
        why: "planning talk lives in mag- contemplated forms (magluluto, maglilinis) and invitations",
        propsVocab: ["magluto", "maglinis", "maglaro"],
        opening: "Mahal, weekend na! Ano ang gagawin natin? Sino ang magluluto, sino ang maglilinis?",
      },
      {
        id: "s-chores-split",
        persona: "the learner's Tatay dividing up Saturday chores, checking in as work proceeds",
        voice: "cedar",
        setting: "Saturday chores day: splitting tasks and reporting progress",
        why: "chore talk cycles through mag- imperatives and completed/incompleted aspect (naglinis ka na ba?)",
        propsVocab: ["maglinis", "magtrabaho", "magbasa"],
        opening: "Anak, linis muna tayo. Alin ang gusto mo — maglinis ng sala o maglaba?",
      },
    ],
  },
  {
    id: "u04",
    title: "More doing: -um- verbs (actor focus)",
    grammarTargets: [
      {
        id: "g-um-aspect",
        pattern: "-um- verb aspect: kumain (completed) / kumakain (incompleted) / kakain (contemplated)",
        exampleFrames: ["Kumain ako ng almusal.", "Bumibili kami ng gulay tuwing weekend.", "Uuwi ako nang maaga."],
      },
      {
        id: "g-um-vs-mag",
        pattern: "which everyday verbs take -um- vs mag-",
        exampleFrames: ["Pumunta ako sa trabaho.", "Nagtrabaho ako buong araw."],
      },
    ],
    vocab: [
      { tl: "kumain", en: "to eat", tags: ["food"] },
      { tl: "uminom", en: "to drink", tags: ["food"] },
      { tl: "bumili", en: "to buy", tags: ["errands"] },
      { tl: "pumunta", en: "to go", tags: ["movement"] },
      { tl: "umuwi", en: "to go home", tags: ["movement"] },
      { tl: "tumulong", en: "to help", tags: ["home"] },
    ],
    registerNotes: ["Answering an elder's 'Kumain ka na ba?' takes opo/hindi pa po, not bare oo/hindi."],
    canDo: ["Narrate my morning with -um- verbs", "Say where I went and when I'll come home"],
    recycleFrom: ["u02", "u03"],
    sceneSeeds: [
      {
        id: "s-almusal-kwento",
        persona: "the learner's Nanay at the breakfast table, asking about yesterday and today's plans",
        voice: "marin",
        setting: "breakfast with Nanay: what happened yesterday, what's the plan today",
        why: "day narration cycles -um- verbs through all three aspects (kumain, pumunta, uuwi)",
        propsVocab: ["kumain", "uminom", "umuwi"],
        opening: "O, gising ka na! Kumain ka na ba? Ikwento mo nga — saan ka pumunta kahapon?",
      },
      {
        id: "s-pamilihan",
        persona: "the learner's wife making the shopping list together before a market run",
        voice: "coral",
        setting: "planning the market run: what to buy, where to go, when to be back",
        why: "errand planning forces bumili/pupunta/uuwi contemplated forms and um-vs-mag choices",
        propsVocab: ["bumili", "pumunta", "tumulong"],
        opening: "Beb, pupunta ako sa palengke mamaya. Ano ang bibilhin ko? Sasama ka ba?",
      },
    ],
  },
  {
    id: "u05",
    title: "The little words: ng and sa",
    grammarTargets: [
      {
        id: "g-ng-object",
        pattern: "ng marks the indefinite object of actor-focus verbs",
        exampleFrames: ["Nagluto ako ng adobo.", "Bumili siya ng gatas."],
      },
      {
        id: "g-ng-possession",
        pattern: "ng links possessor: X ng Y = Y's X",
        exampleFrames: ["bahay ng kapatid ko", "laruan ng bunso"],
      },
      {
        id: "g-sa-location",
        pattern: "sa marks location, direction, and recipients",
        exampleFrames: ["Nasa kusina si Nanay.", "Pumunta kami sa palengke.", "Ibigay mo ito sa kanya."],
      },
    ],
    vocab: [
      { tl: "palengke", en: "market", tags: ["errands"] },
      { tl: "kusina", en: "kitchen", tags: ["home"] },
      { tl: "opisina", en: "office", tags: ["work"] },
      { tl: "paaralan", en: "school", tags: ["kids"] },
      { tl: "lamesa", en: "table", tags: ["home"] },
      { tl: "laruan", en: "toy", tags: ["kids"] },
    ],
    registerNotes: ["kina/kay for going to people's places: 'pumunta kami kina Lola'."],
    canDo: ["Mark objects and possession with ng correctly", "Say where things and people are with sa/nasa"],
    recycleFrom: ["u03", "u04"],
    sceneSeeds: [
      {
        id: "s-hanapan",
        persona: "the learner's wife hunting for the kids' lost things before the school run, slightly rushed",
        voice: "coral",
        setting: "morning scramble: finding the kids' shoes, bag, and water bottle around the house",
        why: "a search scene is a sa/nasa machine (Nasa kusina? Sa ilalim ng lamesa?) with ng-possession everywhere (sapatos ng bunso)",
        propsVocab: ["kusina", "lamesa", "laruan"],
        opening: "Mahal, tulungan mo ako! Nasaan ang sapatos ng bunso? Late na tayo sa paaralan!",
      },
      {
        id: "s-palengke-run",
        persona: "the learner's Nanay walking the market with them, pointing out stalls and comparing goods",
        voice: "marin",
        setting: "a trip through the palengke, buying for tonight's dinner",
        why: "market talk pairs -um-/mag- verbs with ng objects (bumili ng isda) and sa stalls/locations",
        propsVocab: ["palengke", "gulay", "isda"],
        opening: "Halika, anak, dito muna tayo sa gulayan. Ano ang bibilhin natin para sa hapunan?",
      },
    ],
  },
  {
    id: "u06",
    title: "Object focus: -in verbs",
    grammarTargets: [
      {
        id: "g-in-aspect",
        pattern: "-in object-focus aspect: kinain (completed) / kinakain (incompleted) / kakainin (contemplated)",
        exampleFrames: ["Kinain ko ang adobo.", "Nililinis niya ang kusina.", "Kakainin natin ang leftover mamaya."],
      },
      {
        id: "g-of-ng-actor",
        pattern: "ng-form actor (ko/mo/niya) with ang-marked patient in object-focus clauses",
        exampleFrames: ["Niluto ko ang hapunan.", "Kinuha mo ba ang susi?"],
      },
      {
        id: "g-af-vs-of-choice",
        pattern: "choose object focus when the object is definite/specific",
        exampleFrames: ["Bumili ako ng mangga. → Binili ko ang mangga na gusto mo.", "Kumain ako ng adobo. → Kinain ko ang adobo ni Nanay."],
      },
    ],
    vocab: [
      { tl: "kainin", en: "to eat (something specific)", tags: ["food"] },
      { tl: "lutuin", en: "to cook (something specific)", tags: ["food"] },
      { tl: "linisin", en: "to clean (something specific)", tags: ["home"] },
      { tl: "kunin", en: "to get / fetch", tags: ["home"] },
      { tl: "bilhin", en: "to buy (something specific)", tags: ["errands"] },
      { tl: "gawin", en: "to do / make", tags: ["general"] },
    ],
    registerNotes: ["po slots after the first word of the predicate: 'Kinain ko na po.'"],
    canDo: ["Narrate what I ate today using object-focus past forms", "Ask what someone will cook using object-focus future"],
    recycleFrom: ["u03", "u04", "u05"],
    sceneSeeds: [
      {
        id: "s-adobo",
        persona: "the learner's Nanay cooking chicken adobo with them in the kitchen, directing every step",
        voice: "marin",
        setting: "kitchen, cooking chicken adobo with Nanay",
        why: "imperatives + object-focus -in verbs occur naturally (hiwain, lutuin, tikman) — the reference seed",
        propsVocab: ["kawali", "sandok", "toyo", "suka", "bawang"],
        opening: "Halika dito sa kusina, magluluto tayo ng adobo. O, kunin mo muna ang toyo at suka.",
      },
      {
        id: "s-ligpit-sala",
        persona: "the learner's wife tidying the living room with them before Tita visits, assigning specific items",
        voice: "coral",
        setting: "speed-cleaning the sala together before a visitor arrives",
        why: "tidying specific objects demands -in forms with ang patients (linisin ang lamesa, kunin ang mga laruan)",
        propsVocab: ["linisin", "kunin", "ayusin"],
        opening: "Mahal, darating si Tita sa isang oras! Kunin mo ang mga laruan, ako ang maglilinis ng lamesa. Kaya natin ito!",
      },
    ],
  },
  {
    id: "u07",
    title: "Giving and washing: i- and -an verbs",
    grammarTargets: [
      {
        id: "g-i-verbs",
        pattern: "i- conveyance focus: ibinigay (completed) / ibinibigay (incompleted) / ibibigay (contemplated)",
        exampleFrames: ["Ibinigay ko ang regalo kay Lia.", "Iabot mo nga ang toyo."],
      },
      {
        id: "g-an-verbs",
        pattern: "-an locative/benefactive focus: hinugasan / hinuhugasan / huhugasan",
        exampleFrames: ["Hinugasan ko na ang mga pinggan.", "Buksan mo ang bintana."],
      },
    ],
    vocab: [
      { tl: "ibigay", en: "to give (something)", tags: ["general"] },
      { tl: "iabot", en: "to hand over", tags: ["home"] },
      { tl: "itago", en: "to put away / keep", tags: ["home"] },
      { tl: "hugasan", en: "to wash (something)", tags: ["home"] },
      { tl: "buksan", en: "to open (something)", tags: ["home"] },
      { tl: "sarhan", en: "to close (something)", tags: ["home"] },
    ],
    registerNotes: ["nga softens requests: 'Iabot mo nga...' ≈ please hand me..."],
    canDo: ["Ask someone to hand or give me things at the table", "Describe washing/opening/closing household things"],
    recycleFrom: ["u04", "u05", "u06"],
    sceneSeeds: [
      {
        id: "s-hapag-abutan",
        persona: "the learner's Tatay at a busy family dinner where everything needs passing",
        voice: "cedar",
        setting: "family dinner: passing dishes, serving the kids, keeping plates full",
        why: "a crowded table runs on iabot/ibigay requests (Iabot mo nga ang kanin) in both directions",
        propsVocab: ["iabot", "ibigay", "kanin"],
        opening: "O, kain na tayo! Iabot mo nga ang kanin — at ibigay mo muna ang ulam sa bunso.",
      },
      {
        id: "s-hugasan-night",
        persona: "the learner's wife doing the after-dinner cleanup with them, trading tasks",
        voice: "coral",
        setting: "after-dinner cleanup: dishes, counters, windows, lights",
        why: "cleanup pairs -an verbs on surfaces and openings (hugasan, punasan, buksan, sarhan) with i- verbs for putting away",
        propsVocab: ["hugasan", "buksan", "sarhan", "itago"],
        opening: "Salamat sa hapunan, mahal. Ako ang maghuhugas — ikaw, itago mo ang mga leftover, tapos sarhan mo ang bintana?",
      },
    ],
  },
  {
    id: "u08",
    title: "The flavor particles: na, pa, din/rin, lang, naman, muna",
    grammarTargets: [
      {
        id: "g-na-pa",
        pattern: "na (already/now) vs pa (still/yet), incl. 'hindi pa'",
        exampleFrames: ["Kumain na ako.", "Hindi pa ako kumakain.", "Tulog na ang mga bata."],
      },
      {
        id: "g-enclitic-placement",
        pattern: "enclitic ordering after first word: na/pa before din/rin; lang/naman/muna placement",
        exampleFrames: ["Kumain na rin ako.", "Sandali lang po.", "Maglilinis muna ako."],
      },
    ],
    vocab: [
      { tl: "na", en: "already / now", tags: ["particle"] },
      { tl: "pa", en: "still / yet", tags: ["particle"] },
      { tl: "din / rin", en: "also / too", tags: ["particle"] },
      { tl: "lang", en: "just / only", tags: ["particle"] },
      { tl: "naman", en: "on the other hand / softener", tags: ["particle"] },
      { tl: "muna", en: "first / for now", tags: ["particle"] },
    ],
    registerNotes: ["naman softens contradiction: 'Okay naman ako' vs bare 'Okay ako'."],
    canDo: ["Say already / not yet naturally in daily talk", "Soften requests and answers with lang/naman/muna"],
    recycleFrom: ["u05", "u06", "u07"],
    sceneSeeds: [
      {
        id: "s-check-in-gabi",
        persona: "the learner's Nanay doing the evening check-in: who has eaten, who is asleep, what is done",
        voice: "marin",
        setting: "evening status check around the house before bed",
        why: "status checks are pure na/pa territory (Kumain ka na ba? Hindi pa. Tulog na sila.)",
        propsVocab: ["na", "pa", "muna"],
        opening: "Anak, gabi na. Kumain ka na ba? At ang mga bata — tulog na ba sila?",
      },
      {
        id: "s-bilin-umaga",
        persona: "the learner's wife trading quick morning reminders as both rush to start the day",
        voice: "coral",
        setting: "the morning rush: reminders, small requests, who does what first",
        why: "rushed logistics force softened requests (sandali lang, ikaw muna, ako na lang) and stacked enclitics",
        propsVocab: ["lang", "naman", "muna"],
        opening: "Beb, sandali lang — kunin mo muna ang bag ng panganay, ako na lang ang magtitimpla ng gatas!",
      },
    ],
  },
  {
    id: "u09",
    title: "Having and wanting: may/wala, gusto/ayaw",
    grammarTargets: [
      {
        id: "g-may-wala",
        pattern: "existential may/mayroon vs wala (+ng linker)",
        exampleFrames: ["May meeting ako bukas.", "Walang gatas sa ref.", "Mayroon pa bang kanin?"],
      },
      {
        id: "g-gusto-ayaw",
        pattern: "gusto/ayaw + ng noun or + linked verb (gusto kong ...)",
        exampleFrames: ["Gusto ko ng kape.", "Gusto kong magluto ng sinigang.", "Ayaw niyang matulog."],
      },
    ],
    vocab: [
      { tl: "mayroon / may", en: "there is / to have", tags: ["general"] },
      { tl: "wala", en: "none / not have", tags: ["general"] },
      { tl: "gusto", en: "to want / like", tags: ["general"] },
      { tl: "ayaw", en: "to not want", tags: ["general"] },
      { tl: "kailangan", en: "to need", tags: ["general"] },
      { tl: "pwede", en: "can / may", tags: ["general"] },
    ],
    registerNotes: ["'Gusto po ninyo ba ng kape?' — offering to elders takes po + ninyo."],
    canDo: ["Say what we have and don't have at home", "Express wants and needs for myself and the kids"],
    recycleFrom: ["u06", "u07", "u08"],
    sceneSeeds: [
      {
        id: "s-ref-imbentaryo",
        persona: "the learner's wife checking the fridge and pantry together to build the grocery list",
        voice: "coral",
        setting: "fridge-and-pantry inventory before grocery day",
        why: "inventory talk is may/wala on every item (May itlog pa ba? Walang gatas!)",
        propsVocab: ["mayroon", "wala", "kailangan"],
        opening: "Mahal, buksan mo nga ang ref — ano pa ang mayroon tayo? Walang gatas, 'di ba?",
      },
      {
        id: "s-order-merienda",
        persona: "the learner's Tita taking everyone's merienda orders before a food run, opinionated about the choices",
        voice: "marin",
        setting: "deciding what merienda to get for the whole family",
        why: "orders and preferences run on gusto/ayaw + ng and linked verbs (gusto kong subukan...)",
        propsVocab: ["gusto", "ayaw", "pwede"],
        opening: "Mga apo, bibili ako ng merienda! Ano ang gusto ninyo — turon, banana cue, o halo-halo?",
      },
    ],
  },
  {
    id: "u10",
    title: "Telling the story: connectors and narration",
    grammarTargets: [
      {
        id: "g-connectors",
        pattern: "kasi, pero, tapos, kapag, habang, pagkatapos linking clauses",
        exampleFrames: ["Na-late ako kasi ma-traffic.", "Pagkatapos kong magtrabaho, nagluto ako.", "Habang nagluluto ako, naglalaro ang mga bata."],
      },
      {
        id: "g-narrative-aspect",
        pattern: "mixing completed + incompleted aspect inside one short narrative",
        exampleFrames: ["Kumakain kami nang dumating si Tita.", "Naglilinis ako nang tumawag ka."],
      },
    ],
    vocab: [
      { tl: "kasi", en: "because", tags: ["connector"] },
      { tl: "pero", en: "but", tags: ["connector"] },
      { tl: "tapos", en: "then / afterwards", tags: ["connector"] },
      { tl: "kapag", en: "when(ever)", tags: ["connector"] },
      { tl: "habang", en: "while", tags: ["connector"] },
      { tl: "pagkatapos", en: "after", tags: ["connector"] },
    ],
    registerNotes: ["kasi often lands second position in speech: 'Na-late kasi ako.'"],
    canDo: ["Tell a 5-sentence story about my day", "Explain why something happened with kasi"],
    recycleFrom: ["u07", "u08", "u09"],
    sceneSeeds: [
      {
        id: "s-kwento-araw",
        persona: "the learner's wife on the couch after the kids are asleep, wanting the full story of the day",
        voice: "coral",
        setting: "evening couch debrief: tell me everything that happened today, in order",
        why: "a day retold in order forces connectors (tapos, kasi, habang) and mixed narrative aspect",
        propsVocab: ["tapos", "kasi", "habang"],
        opening: "Hay, tulog na sila sa wakas. Halika dito — ikwento mo ang buong araw mo. Umpisahan mo sa umaga!",
      },
      {
        id: "s-balita-tita",
        persona: "the learner's Tita hungry for the full story behind some family news, probing for details",
        voice: "marin",
        setting: "retelling a family story to Tita, who keeps asking bakit and ano'ng sumunod",
        why: "retelling under questioning (bakit? tapos?) drills kasi-explanations and sequencing",
        propsVocab: ["kasi", "pero", "pagkatapos"],
        opening: "Uy, narinig ko may nangyari kamakalawa! Ikwento mo nga sa akin — ano ba talaga ang nangyari?",
      },
    ],
  },
];

export function getUnit(id: string): Unit | undefined {
  return CURRICULUM.find((u) => u.id === id);
}

export function unitIndex(id: string): number {
  return CURRICULUM.findIndex((u) => u.id === id);
}

/** Units the learner has acquired: u01 through currentUnit, inclusive. */
export function acquiredUnits(currentUnitId: string): Unit[] {
  const i = unitIndex(currentUnitId);
  return i === -1 ? [] : CURRICULUM.slice(0, i + 1);
}

/** Closed tag set the feedback tagger may use at this point in the spine. */
export function allowedPatternTags(currentUnitId: string): string[] {
  const targetTags = acquiredUnits(currentUnitId).flatMap((u) =>
    u.grammarTargets.map((t) => t.id)
  );
  return [...new Set([...targetTags, ...GENERIC_PATTERN_TAGS])];
}

/** Default Taglish-dial level per unit (D3 ratio curve; Will tunes). */
export function defaultLevelForUnit(id: string): number {
  const i = unitIndex(id);
  if (i < 0) return 3;
  if (i < 2) return 2;   // u01–u02
  if (i < 5) return 3;   // u03–u05
  if (i < 8) return 4;   // u06–u08
  return 5;              // u09–u10
}

export function getSeed(seedId: string): { unit: Unit; seed: SceneSeed } | undefined {
  for (const unit of CURRICULUM) {
    const seed = unit.sceneSeeds.find((s) => s.id === seedId);
    if (seed) return { unit, seed };
  }
  return undefined;
}

/** Deterministic rotation: the seed after lastSeedId in unit order (wraps). */
export function pickSeed(unitId: string, lastSeedId: string | null): SceneSeed | undefined {
  const unit = getUnit(unitId);
  if (!unit || unit.sceneSeeds.length === 0) return undefined;
  const last = lastSeedId ? unit.sceneSeeds.findIndex((s) => s.id === lastSeedId) : -1;
  return unit.sceneSeeds[(last + 1) % unit.sceneSeeds.length];
}

/** Adapts a seed into the Scenario shape buildInstructions() consumes unchanged. */
export function seedToScenario(seed: SceneSeed, unit: Unit): Scenario {
  return {
    id: seed.id,
    title: unit.title,
    emoji: "🎬",
    description: seed.setting,
    voice: seed.voice,
    scene:
      `You are ${seed.persona}. The scene: ${seed.setting}. ` +
      `Run the scene so its natural tasks require the learner to respond, decide, and act. ` +
      `Season the dialogue with these words when natural: ${seed.propsVocab.join(", ")}.`,
    opening: seed.opening,
  };
}

/** Returns human-readable constraint violations; empty array = valid. */
export function validateCurriculum(units: Unit[]): string[] {
  const errors: string[] = [];
  const ids = units.map((u) => u.id);
  const sorted = [...ids].sort();
  if (ids.join() !== sorted.join()) errors.push("units are not strictly ordered by id");
  units.forEach((u, i) => {
    if (i >= 2 && u.recycleFrom.length === 0)
      errors.push(`${u.id}: recycleFrom is mandatory for u03+`);
    for (const r of u.recycleFrom) {
      if (ids.indexOf(r) === -1 || ids.indexOf(r) >= i)
        errors.push(`${u.id}: recycleFrom '${r}' must reference an earlier unit`);
    }
    for (const t of u.grammarTargets) {
      if (t.exampleFrames.length < 2)
        errors.push(`${u.id}/${t.id}: needs >=2 example frames`);
    }
    if (u.sceneSeeds.length < 2) errors.push(`${u.id}: needs >=2 scene seeds`);
    if (u.vocab.length === 0) errors.push(`${u.id}: vocab must not be empty`);
    if (u.canDo.length === 0) errors.push(`${u.id}: canDo must not be empty`);
  });
  const seedIds = units.flatMap((u) => u.sceneSeeds.map((s) => s.id));
  if (new Set(seedIds).size !== seedIds.length) errors.push("scene seed ids must be globally unique");
  return errors;
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx vitest run lib/__tests__/curriculum.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/curriculum.ts lib/__tests__/curriculum.test.ts
git commit -m "feat: add 10-unit original-content curriculum spine with scene seeds and validation"
```

---

### Task 3: SRS logic (`lib/srs.ts`)

**Files:**
- Create: `lib/srs.ts`
- Test: `lib/__tests__/srs.test.ts`

**Interfaces:**
- Produces (consumed by Tasks 4, 8, 9, 11):
  - `interface SrsEntry { box: number; due: number; lapses: number }` (`due` = epoch ms)
  - `BOX_INTERVALS_DAYS = [1, 2, 4, 8, 16]`
  - `newEntry(now: number): SrsEntry` — box 1, due now
  - `reviewResult(entry: SrsEntry, recalled: boolean, now: number): SrsEntry`
  - `dueItems(srs: Record<string, SrsEntry>, now: number, limit?: number): string[]` — most-overdue first

- [ ] **Step 1: Write failing tests**

```ts
// lib/__tests__/srs.test.ts
import { describe, it, expect } from "vitest";
import { newEntry, reviewResult, dueItems, BOX_INTERVALS_DAYS } from "@/lib/srs";

const DAY = 24 * 60 * 60 * 1000;

describe("srs", () => {
  it("new entries start in box 1, due immediately", () => {
    const e = newEntry(1000);
    expect(e).toEqual({ box: 1, due: 1000, lapses: 0 });
  });

  it("recall promotes a box and schedules by interval", () => {
    const e = reviewResult({ box: 2, due: 0, lapses: 0 }, true, 1000);
    expect(e.box).toBe(3);
    expect(e.due).toBe(1000 + BOX_INTERVALS_DAYS[2] * DAY); // box 3 → 4 days
  });

  it("recall caps at box 5", () => {
    const e = reviewResult({ box: 5, due: 0, lapses: 0 }, true, 0);
    expect(e.box).toBe(5);
  });

  it("failure demotes to box 1 and counts a lapse", () => {
    const e = reviewResult({ box: 4, due: 0, lapses: 1 }, false, 1000);
    expect(e).toEqual({ box: 1, due: 1000 + BOX_INTERVALS_DAYS[0] * DAY, lapses: 2 });
  });

  it("dueItems returns only due keys, most overdue first, capped by limit", () => {
    const srs = {
      a: { box: 1, due: 500, lapses: 0 },
      b: { box: 1, due: 100, lapses: 0 },
      c: { box: 1, due: 2000, lapses: 0 },
    };
    expect(dueItems(srs, 1000)).toEqual(["b", "a"]);
    expect(dueItems(srs, 1000, 1)).toEqual(["b"]);
  });
});
```

- [ ] **Step 2: Run tests, verify fail**

Run: `npx vitest run lib/__tests__/srs.test.ts`
Expected: FAIL — cannot resolve `@/lib/srs`.

- [ ] **Step 3: Implement**

```ts
// lib/srs.ts
/** Leitner-box spaced repetition over vocab keys. Pure functions only. */

export interface SrsEntry {
  box: number; // 1..5
  due: number; // epoch ms
  lapses: number;
}

export const BOX_INTERVALS_DAYS = [1, 2, 4, 8, 16];

const DAY = 24 * 60 * 60 * 1000;

export function newEntry(now: number): SrsEntry {
  return { box: 1, due: now, lapses: 0 };
}

export function reviewResult(entry: SrsEntry, recalled: boolean, now: number): SrsEntry {
  const box = recalled ? Math.min(5, entry.box + 1) : 1;
  return {
    box,
    due: now + BOX_INTERVALS_DAYS[box - 1] * DAY,
    lapses: entry.lapses + (recalled ? 0 : 1),
  };
}

export function dueItems(
  srs: Record<string, SrsEntry>,
  now: number,
  limit = 12
): string[] {
  return Object.entries(srs)
    .filter(([, e]) => e.due <= now)
    .sort(([, a], [, b]) => a.due - b.due)
    .slice(0, limit)
    .map(([k]) => k);
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx vitest run lib/__tests__/srs.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/srs.ts lib/__tests__/srs.test.ts
git commit -m "feat: add Leitner SRS logic"
```

---

### Task 4: Learner state (`lib/learner.ts` + type extensions)

**Files:**
- Modify: `lib/types.ts` (add `patternTag` to `Correction`; add `DrillScore`, `ReviewResult`; extend `Feedback` and `SessionRecord`)
- Create: `lib/learner.ts`
- Test: `lib/__tests__/learner.test.ts`

**Interfaces:**
- Consumes: `SrsEntry`, `newEntry`, `reviewResult` from Task 3; `getUnit`, `unitIndex`, `CURRICULUM` from Task 2.
- Produces (consumed by Tasks 6–12):
  - `type Mode = "target" | "free" | "review"`
  - `interface ErrorPattern { patternTag: string; count: number; lastTs: number; unitId: string; examples: { learnerSaid: string; target: string }[] }`
  - `interface SessionLogEntry { ts: number; mode: Mode; unitId: string; corrections: number; durationMin: number; drillScores?: Record<string, number> }`
  - `interface LearnerState { currentUnit: string; completedUnits: string[]; vocabSrs: Record<string, SrsEntry>; errorLedger: ErrorPattern[]; sessionLog: SessionLogEntry[]; canDoChecks: Record<string, boolean[]>; overrides: { ts: number; unitId: string }[]; lastSeedId: string | null }`
  - `defaultLearnerState(): LearnerState` (currentUnit `"u01"`, lastSeedId `null`)
  - `loadLearnerState(): LearnerState` / `saveLearnerState(s: LearnerState): void` (localStorage key `kausap.learner`, same conventions as `lib/store.ts`)
  - `recordCorrections(state, corrections: { learnerSaid: string; target: string; patternTag?: string }[], unitId: string, ts: number): LearnerState`
  - `topErrorTags(state, n?: number): ErrorPattern[]`
  - `logSession(state, entry: SessionLogEntry): LearnerState`
  - `applyReviewResults(state, results: { item: string; recalled: boolean }[], ts: number): LearnerState`
  - `canAdvance(state): { ok: boolean; reasons: string[] }` — D6: sourced from `mode === "target"` log entries
  - `advanceUnit(state, opts: { override?: boolean; ts: number }): LearnerState`
- In `lib/types.ts`:
  - `Correction` gains `patternTag?: string`
  - `interface DrillScore { targetId: string; score: number; evidence: string }`
  - `interface ReviewResult { item: string; recalled: boolean }`
  - `Feedback` gains `drillScores?: DrillScore[]; reviewResults?: ReviewResult[]`
  - `SessionRecord` gains `mode?: "target" | "free" | "review"; unitId?: string`

- [ ] **Step 1: Extend `lib/types.ts`**

```ts
export interface Correction {
  youSaid: string;
  better: string;
  note: string;
  /** Closed-set error category (curriculum target id or generic tag). */
  patternTag?: string;
}

export interface DrillScore {
  targetId: string;
  score: number; // 0-100
  evidence: string;
}

export interface ReviewResult {
  item: string;
  recalled: boolean;
}
```

And extend the two existing interfaces:

```ts
export interface Feedback {
  summary: string;
  wins?: string[];
  corrections: Correction[];
  vocab: Omit<VocabItem, "scenarioId" | "addedAt">[];
  encouragement: string;
  drillScores?: DrillScore[];
  reviewResults?: ReviewResult[];
}

export interface SessionRecord {
  id: string;
  scenarioId: string;
  taglishLevel: number;
  startedAt: number;
  endedAt: number;
  transcript: TranscriptEntry[];
  feedback: Feedback | null;
  mode?: "target" | "free" | "review";
  unitId?: string;
}
```

- [ ] **Step 2: Write failing tests for the pure state functions**

```ts
// lib/__tests__/learner.test.ts
import { describe, it, expect } from "vitest";
import {
  defaultLearnerState, recordCorrections, topErrorTags, logSession,
  applyReviewResults, canAdvance, advanceUnit,
} from "@/lib/learner";
import { getUnit } from "@/lib/curriculum";

const T = 1_700_000_000_000;

function stateOnU01WithPassedGate() {
  let s = defaultLearnerState();
  s = { ...s, canDoChecks: { u01: getUnit("u01")!.canDo.map(() => true) } };
  const scores = { "g-po-opo": 90, "g-pronoun-basics": 85 };
  s = logSession(s, { ts: T, mode: "target", unitId: "u01", corrections: 1, durationMin: 10, drillScores: scores });
  s = logSession(s, { ts: T + 1, mode: "target", unitId: "u01", corrections: 0, durationMin: 10, drillScores: scores });
  return s;
}

describe("learner state", () => {
  it("starts at u01 with empty ledger and no last seed", () => {
    const s = defaultLearnerState();
    expect(s.currentUnit).toBe("u01");
    expect(s.errorLedger).toEqual([]);
    expect(s.lastSeedId).toBeNull();
  });

  it("recordCorrections aggregates by patternTag and caps examples at 3", () => {
    let s = defaultLearnerState();
    const c = { learnerSaid: "ako ay kain", target: "kumain ako", patternTag: "g-um-aspect" };
    s = recordCorrections(s, [c, c, c, c], "u04", T);
    expect(s.errorLedger).toHaveLength(1);
    expect(s.errorLedger[0].count).toBe(4);
    expect(s.errorLedger[0].examples).toHaveLength(3);
  });

  it("corrections without patternTag are ignored by the ledger", () => {
    const s = recordCorrections(defaultLearnerState(), [{ learnerSaid: "x", target: "y" }], "u01", T);
    expect(s.errorLedger).toEqual([]);
  });

  it("topErrorTags sorts by count desc", () => {
    let s = defaultLearnerState();
    s = recordCorrections(s, [
      { learnerSaid: "a", target: "b", patternTag: "g-word-order" },
      { learnerSaid: "a", target: "b", patternTag: "g-po-opo" },
      { learnerSaid: "a", target: "b", patternTag: "g-po-opo" },
    ], "u01", T);
    expect(topErrorTags(s, 2).map((e) => e.patternTag)).toEqual(["g-po-opo", "g-word-order"]);
  });

  it("applyReviewResults updates SRS boxes", () => {
    let s = defaultLearnerState();
    s = { ...s, vocabSrs: { kumusta: { box: 2, due: 0, lapses: 0 } } };
    s = applyReviewResults(s, [{ item: "kumusta", recalled: true }], T);
    expect(s.vocabSrs["kumusta"].box).toBe(3);
  });

  it("canAdvance blocks a fresh state with reasons", () => {
    const g = canAdvance(defaultLearnerState());
    expect(g.ok).toBe(false);
    expect(g.reasons.length).toBeGreaterThan(0);
  });

  it("canAdvance passes when can-dos checked, two target-scene reports >=80, no current-unit tag in top 3", () => {
    expect(canAdvance(stateOnU01WithPassedGate()).ok).toBe(true);
  });

  it("canAdvance blocks when a current-unit tag is in the ledger top 3", () => {
    let s = stateOnU01WithPassedGate();
    s = recordCorrections(s, [{ learnerSaid: "x", target: "y", patternTag: "g-po-opo" }], "u01", T);
    expect(canAdvance(s).ok).toBe(false);
  });

  it("advanceUnit folds unit vocab into SRS and moves the pointer", () => {
    const s2 = advanceUnit(stateOnU01WithPassedGate(), { ts: T });
    expect(s2.currentUnit).toBe("u02");
    expect(s2.completedUnits).toContain("u01");
    expect(s2.vocabSrs["kumusta"]).toBeDefined(); // u01 vocab folded in
    expect(s2.overrides).toEqual([]);
  });

  it("advanceUnit with override logs the override", () => {
    const s2 = advanceUnit(defaultLearnerState(), { override: true, ts: T });
    expect(s2.currentUnit).toBe("u02");
    expect(s2.overrides).toEqual([{ ts: T, unitId: "u01" }]);
  });
});
```

- [ ] **Step 3: Run tests, verify fail**

Run: `npx vitest run lib/__tests__/learner.test.ts`
Expected: FAIL — cannot resolve `@/lib/learner`.

- [ ] **Step 4: Implement `lib/learner.ts`**

```ts
// lib/learner.ts
/**
 * Learner state for the curriculum spine (D2). Pure state transitions +
 * thin localStorage wrappers, following lib/store.ts conventions.
 * D2 reconciliation: all persistence in this app is client-side
 * localStorage; API routes stay stateless (context sent per request).
 */
import { CURRICULUM, getUnit, unitIndex } from "./curriculum";
import { newEntry, reviewResult, type SrsEntry } from "./srs";

const LEARNER_KEY = "kausap.learner";

export type Mode = "target" | "free" | "review";

export interface ErrorPattern {
  patternTag: string;
  count: number;
  lastTs: number;
  unitId: string;
  examples: { learnerSaid: string; target: string }[];
}

export interface SessionLogEntry {
  ts: number;
  mode: Mode;
  unitId: string;
  corrections: number;
  durationMin: number;
  drillScores?: Record<string, number>;
}

export interface LearnerState {
  currentUnit: string;
  completedUnits: string[];
  vocabSrs: Record<string, SrsEntry>;
  errorLedger: ErrorPattern[];
  sessionLog: SessionLogEntry[];
  canDoChecks: Record<string, boolean[]>;
  overrides: { ts: number; unitId: string }[];
  lastSeedId: string | null;
}

export function defaultLearnerState(): LearnerState {
  return {
    currentUnit: "u01",
    completedUnits: [],
    vocabSrs: {},
    errorLedger: [],
    sessionLog: [],
    canDoChecks: {},
    overrides: [],
    lastSeedId: null,
  };
}

export function loadLearnerState(): LearnerState {
  if (typeof window === "undefined") return defaultLearnerState();
  try {
    const raw = window.localStorage.getItem(LEARNER_KEY);
    if (!raw) return defaultLearnerState();
    return { ...defaultLearnerState(), ...(JSON.parse(raw) as LearnerState) };
  } catch {
    return defaultLearnerState();
  }
}

export function saveLearnerState(state: LearnerState) {
  window.localStorage.setItem(LEARNER_KEY, JSON.stringify(state));
}

export function recordCorrections(
  state: LearnerState,
  corrections: { learnerSaid: string; target: string; patternTag?: string }[],
  unitId: string,
  ts: number
): LearnerState {
  const ledger = state.errorLedger.map((e) => ({ ...e, examples: [...e.examples] }));
  for (const c of corrections) {
    if (!c.patternTag) continue;
    const existing = ledger.find((e) => e.patternTag === c.patternTag);
    if (existing) {
      existing.count += 1;
      existing.lastTs = ts;
      if (existing.examples.length < 3)
        existing.examples.push({ learnerSaid: c.learnerSaid, target: c.target });
    } else {
      ledger.push({
        patternTag: c.patternTag,
        count: 1,
        lastTs: ts,
        unitId,
        examples: [{ learnerSaid: c.learnerSaid, target: c.target }],
      });
    }
  }
  return { ...state, errorLedger: ledger };
}

export function topErrorTags(state: LearnerState, n = 3): ErrorPattern[] {
  return [...state.errorLedger].sort((a, b) => b.count - a.count).slice(0, n);
}

export function logSession(state: LearnerState, entry: SessionLogEntry): LearnerState {
  return { ...state, sessionLog: [...state.sessionLog, entry] };
}

export function applyReviewResults(
  state: LearnerState,
  results: { item: string; recalled: boolean }[],
  ts: number
): LearnerState {
  const srs = { ...state.vocabSrs };
  for (const r of results) {
    const entry = srs[r.item] ?? newEntry(ts);
    srs[r.item] = reviewResult(entry, r.recalled, ts);
  }
  return { ...state, vocabSrs: srs };
}

/** D6 advancement gate. Advisory-with-override; scores from M1 reports. */
export function canAdvance(state: LearnerState): { ok: boolean; reasons: string[] } {
  const unit = getUnit(state.currentUnit);
  const reasons: string[] = [];
  if (!unit) return { ok: false, reasons: ["unknown current unit"] };

  const checks = state.canDoChecks[unit.id] ?? [];
  const unchecked = unit.canDo.filter((_, i) => !checks[i]);
  if (unchecked.length > 0)
    reasons.push(`Can-do items not yet self-checked: ${unchecked.join("; ")}`);

  const targetScenes = state.sessionLog
    .filter((s) => s.mode === "target" && s.unitId === unit.id && s.drillScores)
    .slice(-2);
  if (targetScenes.length < 2) {
    reasons.push("Need two completed Target Scenes for this unit");
  } else {
    for (const t of unit.grammarTargets) {
      const low = targetScenes.some((d) => (d.drillScores?.[t.id] ?? 0) < 80);
      if (low) reasons.push(`Accuracy below 80% on ${t.id} in the last two Target Scenes`);
    }
  }

  const unitTags = new Set(unit.grammarTargets.map((t) => t.id));
  const offending = topErrorTags(state, 3).filter((e) => unitTags.has(e.patternTag));
  if (offending.length > 0)
    reasons.push(
      `Current-unit patterns still in your top errors: ${offending.map((e) => e.patternTag).join(", ")}`
    );

  return { ok: reasons.length === 0, reasons };
}

/** Advance to the next unit; folds the finished unit's vocab into SRS. */
export function advanceUnit(
  state: LearnerState,
  opts: { override?: boolean; ts: number }
): LearnerState {
  const i = unitIndex(state.currentUnit);
  const unit = CURRICULUM[i];
  const next = CURRICULUM[i + 1];
  if (!unit || !next) return state;

  const srs = { ...state.vocabSrs };
  for (const v of unit.vocab) {
    if (!srs[v.tl]) srs[v.tl] = newEntry(opts.ts);
  }
  return {
    ...state,
    currentUnit: next.id,
    completedUnits: [...state.completedUnits, unit.id],
    vocabSrs: srs,
    overrides: opts.override
      ? [...state.overrides, { ts: opts.ts, unitId: unit.id }]
      : state.overrides,
  };
}
```

- [ ] **Step 5: Run tests + typecheck, verify pass**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass; no type errors.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/learner.ts lib/__tests__/learner.test.ts
git commit -m "feat: add learner state with error ledger, session log, SRS folding, and advancement gate"
```

---

### Task 5: Curriculum prompt assembly (`lib/curriculumPrompt.ts`)

**Files:**
- Create: `lib/curriculumPrompt.ts`
- Test: `lib/__tests__/curriculumPrompt.test.ts`

**Interfaces:**
- Consumes: `acquiredUnits`, `getUnit` (Task 2).
- Produces (consumed by Task 6):
  - `interface CurriculumContext { mode: "target" | "free" | "review"; currentUnit: string; errorFocus: { patternTag: string; example?: string }[]; reviewItems?: string[] }`
  - `buildCurriculumBlocks(ctx: CurriculumContext): string` — text appended AFTER the output of `buildInstructions()`; never modifies it. Returns `""` for an unknown unit id.

- [ ] **Step 1: Write failing tests**

```ts
// lib/__tests__/curriculumPrompt.test.ts
import { describe, it, expect } from "vitest";
import { buildCurriculumBlocks } from "@/lib/curriculumPrompt";

describe("curriculum prompt blocks", () => {
  it("includes elicitation goals for the current unit and a SOFT scope preference", () => {
    const s = buildCurriculumBlocks({ mode: "free", currentUnit: "u03", errorFocus: [] });
    expect(s).toContain("u03");
    expect(s).toContain("mag-");            // current unit payload present
    expect(s.toLowerCase()).toContain("prefer");   // soft preference, not a contract
    expect(s).not.toContain("kakainin");    // u06 frame must not leak
  });

  it("includes recycling directive when the unit has recycleFrom", () => {
    const s = buildCurriculumBlocks({ mode: "free", currentUnit: "u06", errorFocus: [] });
    expect(s).toContain("Recycle");
    expect(s).toContain("u05");
  });

  it("includes error focus items when provided", () => {
    const s = buildCurriculumBlocks({
      mode: "free", currentUnit: "u04",
      errorFocus: [{ patternTag: "g-um-aspect", example: "ako ay kain" }],
    });
    expect(s).toContain("g-um-aspect");
  });

  it("target mode adds elicitation directives for each current-unit target", () => {
    const s = buildCurriculumBlocks({ mode: "target", currentUnit: "u06", errorFocus: [] });
    expect(s).toContain("TARGET SCENE");
    expect(s).toContain("g-in-aspect");
  });

  it("review mode lists the items to probe", () => {
    const s = buildCurriculumBlocks({
      mode: "review", currentUnit: "u05", errorFocus: [], reviewItems: ["palengke", "kusina"],
    });
    expect(s).toContain("palengke");
    expect(s).toContain("kusina");
  });

  it("returns empty string for unknown unit", () => {
    expect(buildCurriculumBlocks({ mode: "free", currentUnit: "u99", errorFocus: [] })).toBe("");
  });
});
```

- [ ] **Step 2: Run tests, verify fail**

Run: `npx vitest run lib/__tests__/curriculumPrompt.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```ts
// lib/curriculumPrompt.ts
/**
 * D3 session-instruction assembly: curriculum blocks appended AFTER the
 * scenario instructions from buildInstructions(). The invariant blocks
 * (accent, recasts, Taglish policy, lifeline) are never touched — these
 * blocks only add elicitation steering on top.
 */
import { acquiredUnits, getUnit } from "./curriculum";

export interface CurriculumContext {
  mode: "target" | "free" | "review";
  currentUnit: string;
  errorFocus: { patternTag: string; example?: string }[];
  reviewItems?: string[];
}

export function buildCurriculumBlocks(ctx: CurriculumContext): string {
  const unit = getUnit(ctx.currentUnit);
  if (!unit) return "";
  const acquired = acquiredUnits(ctx.currentUnit);

  const payload = `
## Curriculum: current unit ${unit.id} — ${unit.title}

Elicitation goals — steer the scene so the learner NEEDS these patterns to respond (a question they must answer with it, a task that requires it):
${unit.grammarTargets
  .map((t) => `- ${t.id}: ${t.pattern}. Model frames you can use yourself: ${t.exampleFrames.join(" | ")}`)
  .join("\n")}
Seed these words naturally in dialogue: ${unit.vocab.map((v) => `${v.tl} (${v.en})`).join(", ")}.
Register notes: ${unit.registerNotes.join(" ")}
The learner is working toward: ${unit.canDo.join("; ")}.`;

  const scope = `
## Scope preference (soft)

The learner has covered: ${acquired.map((u) => `${u.id} (${u.title})`).join("; ")}.
Prefer structures from these units in your own speech and in what you elicit. If the learner reaches beyond them, respond naturally — do not block or correct scope, and do not spontaneously teach grammar from later units. This is steering, not a contract.`;

  const recycling =
    unit.recycleFrom.length > 0
      ? `
## Recycling

Weave at least 3 grammar patterns or vocabulary items from earlier units ${unit.recycleFrom.join(", ")} into the scene — naturally, without announcing it.`
      : "";

  const errorFocus =
    ctx.errorFocus.length > 0
      ? `
## Error focus

The learner's recurring error patterns: ${ctx.errorFocus
          .map((e) => e.patternTag + (e.example ? ` (e.g. they said "${e.example}")` : ""))
          .join("; ")}.
Engineer natural in-scene openings — a request, a question that requires the form — for the learner to produce these patterns CORRECTLY this session. Recast warmly when they miss.`
      : "";

  let mode = "";
  if (ctx.mode === "target") {
    mode = `
## Session mode: TARGET SCENE

This scene exists to elicit the current unit's grammar. For each target, engineer at least 3 natural chances for the learner to produce it:
${unit.grammarTargets.map((t) => `- ${t.id}: "${t.pattern}"`).join("\n")}
Stay fully in character; the engineering hides inside the scene. Keep your turns extra short so the learner talks more.`;
  } else if (ctx.mode === "review") {
    mode = `
## Session mode: REVIEW SPRINT (about 5 minutes)

Run the scene as a quick, playful game. Create brisk natural moments that force the learner to recall and USE each of these items: ${(ctx.reviewItems ?? []).join(", ")}.
One item per exchange, warm energy. Do not define a word for them unless they fail twice.`;
  }

  return [payload, scope, recycling, errorFocus, mode].filter(Boolean).join("\n");
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx vitest run lib/__tests__/curriculumPrompt.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/curriculumPrompt.ts lib/__tests__/curriculumPrompt.test.ts
git commit -m "feat: add curriculum prompt blocks (elicitation goals, soft scope, recycling, error focus, modes)"
```

---

### Task 6: Session route + realtime client accept curriculum context and seeds

**Files:**
- Modify: `app/api/session/route.ts`
- Modify: `lib/realtime.ts` (connect signature)
- Modify: `app/practice/[scenarioId]/page.tsx` (only the one `connect` call, to keep the app compiling)

**Interfaces:**
- Consumes: `buildCurriculumBlocks`, `CurriculumContext` (Task 5); `getUnit`, `getSeed`, `seedToScenario` (Task 2).
- Produces (consumed by Task 8):
  - POST `/api/session` body gains optional `mode`, `currentUnit`, `errorFocus`, `reviewItems`, `seedId`. When `seedId` resolves, the server builds the scenario from the seed (via `seedToScenario`) instead of `body.scenarioId`. Response unchanged.
  - `RealtimeSession.connect(opts: ConnectOptions)` where `interface ConnectOptions { scenarioId: string; taglishLevel: number; voice?: string; reviewVocab?: string[]; mode?: "target" | "free" | "review"; currentUnit?: string; errorFocus?: { patternTag: string; example?: string }[]; reviewItems?: string[]; seedId?: string }` — exported from `lib/realtime.ts`.

- [ ] **Step 1: Update `app/api/session/route.ts`**

Add imports at the top:

```ts
import { buildCurriculumBlocks, type CurriculumContext } from "@/lib/curriculumPrompt";
import { getSeed, getUnit, seedToScenario } from "@/lib/curriculum";
```

Replace the scenario resolution (currently `const scenario = getScenario(body.scenarioId); if (!scenario) ...`) with seed-aware resolution:

```ts
  const seedHit = typeof body.seedId === "string" ? getSeed(body.seedId) : undefined;
  const scenario = seedHit
    ? seedToScenario(seedHit.seed, seedHit.unit)
    : getScenario(body.scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Unknown scenario." }, { status: 400 });
  }
```

After the `reviewVocab` parsing block, add validated curriculum-context parsing:

```ts
  const MODES = ["target", "free", "review"] as const;
  const mode = MODES.includes(body.mode) ? (body.mode as CurriculumContext["mode"]) : "free";
  const currentUnit =
    typeof body.currentUnit === "string" && getUnit(body.currentUnit) ? body.currentUnit : null;
  const errorFocus: CurriculumContext["errorFocus"] = Array.isArray(body.errorFocus)
    ? body.errorFocus
        .filter((e: unknown): e is { patternTag: string; example?: string } =>
          typeof e === "object" && e !== null &&
          typeof (e as { patternTag?: unknown }).patternTag === "string" &&
          (e as { patternTag: string }).patternTag.length <= 40
        )
        .slice(0, 3)
        .map((e) => ({
          patternTag: e.patternTag,
          example: typeof e.example === "string" ? e.example.slice(0, 120) : undefined,
        }))
    : [];
  const reviewItems: string[] = Array.isArray(body.reviewItems)
    ? body.reviewItems.filter((w: unknown) => typeof w === "string" && w.length <= 40).slice(0, 12)
    : [];

  const curriculumBlocks = currentUnit
    ? buildCurriculumBlocks({ mode, currentUnit, errorFocus, reviewItems })
    : "";
```

Then change the `instructions` field in the fetch body from:

```ts
        instructions: buildInstructions(scenario, taglishLevel, reviewVocab),
```

to (INVARIANT: append-only — `buildInstructions` output is never altered):

```ts
        instructions: buildInstructions(scenario, taglishLevel, reviewVocab) + curriculumBlocks,
```

- [ ] **Step 2: Update `lib/realtime.ts` connect signature**

Add the exported options interface at top level:

```ts
export interface ConnectOptions {
  scenarioId: string;
  taglishLevel: number;
  voice?: string;
  reviewVocab?: string[];
  mode?: "target" | "free" | "review";
  currentUnit?: string;
  errorFocus?: { patternTag: string; example?: string }[];
  reviewItems?: string[];
  seedId?: string;
}
```

Replace the positional `connect` signature:

```ts
  async connect(opts: ConnectOptions): Promise<void> {
    this.callbacks.onStatus("connecting", "Requesting session…");

    const tokenRes = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
```

(The rest of `connect` is unchanged.)

- [ ] **Step 3: Fix the one existing caller so the app compiles**

In `app/practice/[scenarioId]/page.tsx`, change:

```ts
      await session.connect(scenario.id, taglishLevel, voice ?? scenario.voice, reviewVocab);
```

to:

```ts
      await session.connect({
        scenarioId: scenario.id,
        taglishLevel,
        voice: voice ?? scenario.voice,
        reviewVocab,
      });
```

(Full curriculum wiring lands in Task 8.)

- [ ] **Step 4: Typecheck and verify against the live route**

Run: `npx tsc --noEmit` — expected: no errors.

Seed-driven mint (dev server must be running — `npm run dev` if not):

```bash
curl -s -X POST http://localhost:3000/api/session -H 'Content-Type: application/json' \
  -d '{"seedId":"s-adobo","taglishLevel":4,"mode":"target","currentUnit":"u06","errorFocus":[{"patternTag":"g-in-aspect","example":"ako ay kain ang adobo"}]}' \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('OK' if d.get('clientSecret') else d)"
```

Expected: `OK`.

Backward compatibility (no curriculum fields, plain scenario):

```bash
curl -s -X POST http://localhost:3000/api/session -H 'Content-Type: application/json' \
  -d '{"scenarioId":"almusal","taglishLevel":3}' \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('OK' if d.get('clientSecret') else d)"
```

Expected: `OK`.

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/session/route.ts lib/realtime.ts app/practice
git commit -m "feat: session route resolves scene seeds and appends curriculum blocks; connect() takes options"
```

---

### Task 7: Feedback route — patternTags, target scoring, review results (D5)

**Files:**
- Modify: `app/api/feedback/route.ts`

**Interfaces:**
- Consumes: `allowedPatternTags`, `getUnit` (Task 2).
- Produces (consumed by Task 8):
  - POST `/api/feedback` body gains optional `mode`, `currentUnit`, `reviewItems: string[]`.
  - Response `feedback.corrections[i].patternTag` present (closed allowed set) when `currentUnit` was sent.
  - `mode === "target"` → `feedback.drillScores: { targetId, score, evidence }[]` covering every current-unit grammar target, each with a one-line justification (`evidence`).
  - `mode === "review"` → `feedback.reviewResults: { item, recalled }[]` covering every sent reviewItem.

- [ ] **Step 1: Add imports and request parsing**

At the top of `app/api/feedback/route.ts`:

```ts
import { allowedPatternTags, getUnit } from "@/lib/curriculum";
```

After the transcript parsing (`learnerLines` check):

```ts
  const MODES = ["target", "free", "review"] as const;
  const mode = MODES.includes(body.mode) ? (body.mode as (typeof MODES)[number]) : "free";
  const unit = typeof body.currentUnit === "string" ? getUnit(body.currentUnit) : undefined;
  const reviewItems: string[] = Array.isArray(body.reviewItems)
    ? body.reviewItems.filter((w: unknown) => typeof w === "string" && w.length <= 40).slice(0, 12)
    : [];
```

- [ ] **Step 2: Make the schema dynamic per request**

Rename the existing `FEEDBACK_SCHEMA` const to `BASE_FEEDBACK_SCHEMA`, then add:

```ts
function buildFeedbackSchema(opts: {
  tags: string[] | null;
  drillTargets: string[] | null;
  reviewItems: string[] | null;
}) {
  const schema = structuredClone(BASE_FEEDBACK_SCHEMA) as Record<string, unknown> & {
    properties: Record<string, unknown>;
    required: string[];
  };
  const corrections = schema.properties.corrections as {
    items: { properties: Record<string, unknown>; required: string[] };
  };
  if (opts.tags) {
    corrections.items.properties.patternTag = {
      type: "string",
      enum: opts.tags,
      description: "The single best-matching error category. Prefer a unit grammar-target id when one fits; otherwise the closest generic tag.",
    };
    corrections.items.required.push("patternTag");
  }
  if (opts.drillTargets) {
    schema.properties.drillScores = {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["targetId", "score", "evidence"],
        properties: {
          targetId: { type: "string", enum: opts.drillTargets },
          score: { type: "integer", minimum: 0, maximum: 100, description: "Accuracy producing this pattern across the session." },
          evidence: { type: "string", description: "One-line justification quoting a learner utterance." },
        },
      },
    };
    schema.required.push("drillScores");
  }
  if (opts.reviewItems) {
    schema.properties.reviewResults = {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "recalled"],
        properties: {
          item: { type: "string", enum: opts.reviewItems },
          recalled: { type: "boolean", description: "Did the learner successfully recall and use this item?" },
        },
      },
    };
    schema.required.push("reviewResults");
  }
  return schema;
}
```

- [ ] **Step 3: Extend the system prompt and wire the schema in**

Before the fetch, compute:

```ts
  const tags = unit ? allowedPatternTags(unit.id) : null;
  const drillTargets = mode === "target" && unit ? unit.grammarTargets.map((t) => t.id) : null;
  const schema = buildFeedbackSchema({
    tags,
    drillTargets,
    reviewItems: mode === "review" && reviewItems.length > 0 ? reviewItems : null,
  });

  const curriculumNote = unit
    ? `\nThe learner follows a curriculum; current unit: ${unit.id} (${unit.title}). ` +
      `Tag every correction with exactly one patternTag from the allowed list. ` +
      `REMINDER, now enforced in the tags too: code-switching into English is NEVER an error — never emit a correction, and therefore never a patternTag, for mixing in English. ` +
      (drillTargets
        ? `This was a TARGET SCENE: additionally score the learner 0-100 on each grammar target (${drillTargets.join(", ")}) based on how accurately they produced it when the scene called for it; justify each score in one line quoting them. A target the scene never elicited scores by absence of evidence: 50 with a note. `
        : "") +
      (mode === "review" && reviewItems.length > 0
        ? `This was a REVIEW SPRINT probing these items: ${reviewItems.join(", ")}. For each, judge whether the learner recalled and used it (recalled=true/false). `
        : "")
    : "";
```

Append `curriculumNote` to the existing system message content string, and change `response_format` to use the dynamic schema:

```ts
      response_format: {
        type: "json_schema",
        json_schema: { name: "session_feedback", strict: true, schema },
      },
```

- [ ] **Step 4: Typecheck and verify with fixture transcripts**

Run: `npx tsc --noEmit` — expected: clean.

Target-mode round trip (dev server running):

```bash
curl -s -X POST http://localhost:3000/api/feedback -H 'Content-Type: application/json' -d '{
  "mode":"target","currentUnit":"u03",
  "transcript":[
    {"id":"p1","speaker":"partner","text":"Anak, ano ang ginawa mo kanina?","final":true},
    {"id":"y1","speaker":"you","text":"Nagluto ako ng pasta kanina.","final":true},
    {"id":"p2","speaker":"partner","text":"Ano ang gagawin mo bukas?","final":true},
    {"id":"y2","speaker":"you","text":"Ako ay maglinis ang kusina bukas.","final":true}
  ]}' | python3 -m json.tool
```

Expected: `feedback.drillScores` has `g-mag-aspect` and `g-mag-imperative` entries with evidence; every correction carries a `patternTag` from the allowed set (the y2 error should tag `g-mag-aspect`, `g-aspect`, or `g-ang-ng-confusion`).

**Code-switching fixture (acceptance 2 — zero tags on pure code-switching):**

```bash
curl -s -X POST http://localhost:3000/api/feedback -H 'Content-Type: application/json' -d '{
  "mode":"free","currentUnit":"u04",
  "transcript":[
    {"id":"p1","speaker":"partner","text":"Kumusta ang araw mo, anak?","final":true},
    {"id":"y1","speaker":"you","text":"Okay naman! Pumunta ako sa office tapos may meeting kami about sa new project.","final":true},
    {"id":"p2","speaker":"partner","text":"Ay mabuti! Kumain ka na ba ng lunch?","final":true},
    {"id":"y2","speaker":"you","text":"Yes, kumain na ako ng sandwich sa break room.","final":true}
  ]}' | python3 -c "import json,sys; f=json.load(sys.stdin)['feedback']; print('corrections:', len(f['corrections']), [c.get('patternTag') for c in f['corrections']])"
```

Expected: `corrections: 0 []` — this transcript is grammatical Taglish; any correction here is a false positive. If a correction appears, tighten the code-switching line in `curriculumNote` and rerun until clean.

Review-mode round trip:

```bash
curl -s -X POST http://localhost:3000/api/feedback -H 'Content-Type: application/json' -d '{
  "mode":"review","currentUnit":"u05","reviewItems":["palengke","kusina"],
  "transcript":[
    {"id":"p1","speaker":"partner","text":"Saan ka bumili ng gulay?","final":true},
    {"id":"y1","speaker":"you","text":"Bumili ako ng gulay sa palengke.","final":true},
    {"id":"p2","speaker":"partner","text":"Nasaan ang toyo?","final":true},
    {"id":"y2","speaker":"you","text":"Um, it is in the... the room where we cook.","final":true}
  ]}' | python3 -c "import json,sys; print(json.load(sys.stdin)['feedback']['reviewResults'])"
```

Expected: `palengke` → `recalled: true`; `kusina` → `recalled: false`.

Backward compatibility: rerun a plain transcript call with no curriculum fields; feedback returns without `patternTag`.

- [ ] **Step 5: Commit**

```bash
git add app/api/feedback/route.ts
git commit -m "feat: feedback route tags corrections from controlled vocabulary, scores target scenes, judges review recall"
```

---

### Task 8: Practice page wiring (modes, seeds, context out, state updates in)

**Files:**
- Modify: `app/practice/[scenarioId]/page.tsx`
- Modify: `app/components/FeedbackReport.tsx`

**Interfaces:**
- Consumes: `loadLearnerState`, `saveLearnerState`, `recordCorrections`, `logSession`, `applyReviewResults`, `topErrorTags`, `Mode` (Task 4); `dueItems` (Task 3); `ConnectOptions` (Task 6); feedback fields (Task 7); `getSeed`, `seedToScenario`, `defaultLevelForUnit` (Task 2).
- Produces: `/practice/[scenarioId]?mode=target|free|review` and `/practice/seed?seed=<seedId>&mode=target` URL forms (Task 9 links to them). Sessions write ledger/SRS/log + lastSeedId on completion.

- [ ] **Step 1: Resolve scenario from seed or static list; read mode**

In `Practice()` (after `taglishLevel`):

```ts
  const seedId = searchParams.get("seed");
  const seedHit = seedId ? getSeed(seedId) : undefined;
  const scenario = seedHit ? seedToScenario(seedHit.seed, seedHit.unit) : getScenario(scenarioId);

  const modeParam = searchParams.get("mode");
  const mode: Mode = modeParam === "target" || modeParam === "review" ? modeParam : "free";
```

(Remove the earlier `const scenario = getScenario(scenarioId);` line. The existing `if (!scenario)` unknown-scenario guard now covers bad seeds too.)

Add imports:

```ts
import { getSeed, seedToScenario } from "@/lib/curriculum";
import {
  loadLearnerState, saveLearnerState, recordCorrections, logSession,
  applyReviewResults, topErrorTags, type Mode,
} from "@/lib/learner";
import { dueItems } from "@/lib/srs";
```

- [ ] **Step 2: Send curriculum context in `start()`; record lastSeedId**

Add a ref for review items:

```ts
  const reviewItemsRef = useRef<string[] | undefined>(undefined);
```

Replace the connect call inside `start()`:

```ts
    const learner = loadLearnerState();
    const errorFocus = topErrorTags(learner, 3).map((e) => ({
      patternTag: e.patternTag,
      example: e.examples[0]?.learnerSaid,
    }));
    const reviewItems =
      mode === "review" ? dueItems(learner.vocabSrs, Date.now(), 12) : undefined;
    reviewItemsRef.current = reviewItems;
    if (seedHit) saveLearnerState({ ...learner, lastSeedId: seedHit.seed.id });
    try {
      await session.connect({
        scenarioId: scenario.id,
        taglishLevel,
        voice: voice ?? scenario.voice,
        reviewVocab,
        mode,
        currentUnit: learner.currentUnit,
        errorFocus,
        reviewItems,
        seedId: seedHit?.seed.id,
      });
    } catch (err) {
```

- [ ] **Step 3: Send context to feedback and apply results in `hangUp()`**

Change the feedback fetch body to:

```ts
        body: JSON.stringify({
          transcript,
          mode,
          currentUnit: loadLearnerState().currentUnit,
          reviewItems: reviewItemsRef.current,
        }),
```

When the `SessionRecord` is created, set:

```ts
      mode,
      unitId: loadLearnerState().currentUnit,
```

After `setFeedbackState("done")` and the existing `addVocab(...)` call, add:

```ts
      let learner = loadLearnerState();
      const now = Date.now();
      learner = recordCorrections(
        learner,
        fb.corrections.map((c) => ({ learnerSaid: c.youSaid, target: c.better, patternTag: c.patternTag })),
        learner.currentUnit,
        now
      );
      if (fb.reviewResults) learner = applyReviewResults(learner, fb.reviewResults, now);
      learner = logSession(learner, {
        ts: startedAtRef.current,
        mode,
        unitId: learner.currentUnit,
        corrections: fb.corrections.length,
        durationMin: Math.max(1, Math.round((now - startedAtRef.current) / 60000)),
        drillScores: fb.drillScores
          ? Object.fromEntries(fb.drillScores.map((d) => [d.targetId, d.score]))
          : undefined,
      });
      saveLearnerState(learner);
```

- [ ] **Step 4: Mode selector on the idle card + header badge**

In the `status === "idle"` card, above the voice picker (Link is already imported):

```tsx
          <div className="mb-4 flex items-center justify-center gap-2 text-sm">
            {(["target", "free", "review"] as const).map((m) => (
              <Link
                key={m}
                href={`/practice/${scenarioId}?level=${taglishLevel}&mode=${m}${seedId ? `&seed=${seedId}` : ""}`}
                className={`rounded-full border px-3 py-1 ${
                  mode === m
                    ? "border-(--accent) bg-(--accent) text-white"
                    : "border-black/20 dark:border-white/20"
                }`}
              >
                {m === "target" ? "🎬 Target scene" : m === "free" ? "🗣️ Free scene" : "⚡ Review sprint"}
              </Link>
            ))}
          </div>
```

In the header `<p className="text-sm opacity-70">`:

```tsx
            {scenario.description} · {TAGLISH_LABELS[taglishLevel]}
            {mode !== "free" && <> · {mode === "target" ? "Target scene" : "Review sprint"}</>}
```

- [ ] **Step 5: Pattern chips and target scores in `FeedbackReport.tsx`**

Read `app/components/FeedbackReport.tsx` first; match its existing section markup. In the corrections rendering, after the note, add:

```tsx
              {c.patternTag && (
                <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-xs opacity-70 dark:bg-white/10">
                  {c.patternTag}
                </span>
              )}
```

Before the encouragement section, add:

```tsx
      {feedback.drillScores && feedback.drillScores.length > 0 && (
        <section>
          <h3 className="font-semibold">🎬 Target scores</h3>
          <ul className="mt-1 space-y-1 text-sm">
            {feedback.drillScores.map((d) => (
              <li key={d.targetId}>
                <div className="flex items-baseline justify-between gap-2">
                  <span>{d.targetId}</span>
                  <span className={d.score >= 80 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}>
                    {d.score}/100
                  </span>
                </div>
                <p className="text-xs opacity-60">{d.evidence}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
```

- [ ] **Step 6: Typecheck, test, verify manually**

Run: `npx tsc --noEmit && npx vitest run` — expected: clean, all pass.

Manual: open `http://localhost:3000/practice/seed?seed=s-adobo&mode=target&level=4` — the adobo seed scene renders with Target-scene mode active. Start, speak two sentences, hang up; the report shows target scores with evidence + pattern chips. In devtools: `JSON.parse(localStorage.getItem("kausap.learner"))` — `errorLedger`, `sessionLog`, and `lastSeedId: "s-adobo"` populated. Also verify a plain scenario (`/practice/cooking?level=3`) still works exactly as before.

- [ ] **Step 7: Commit**

```bash
git add app/practice app/components/FeedbackReport.tsx
git commit -m "feat: wire seeds, modes, and curriculum context through practice sessions into learner state"
```

---

### Task 9: Curriculum page (spine UI, can-do checklist, advancement gate)

**Files:**
- Create: `app/curriculum/page.tsx`
- Modify: `app/page.tsx` (current-unit banner)
- Modify: `app/layout.tsx` (nav link — read it first, match existing nav style)

**Interfaces:**
- Consumes: `CURRICULUM`, `getUnit`, `unitIndex`, `defaultLevelForUnit`, `pickSeed` (Task 2); `loadLearnerState`, `saveLearnerState`, `canAdvance`, `advanceUnit` (Task 4); `useHydrated` (existing).
- Produces: route `/curriculum`; "Start Target Scene" links using seed rotation (never repeats `lastSeedId`).

- [ ] **Step 1: Create `app/curriculum/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { CURRICULUM, defaultLevelForUnit, getUnit, pickSeed, unitIndex } from "@/lib/curriculum";
import { advanceUnit, canAdvance, loadLearnerState, saveLearnerState, type LearnerState } from "@/lib/learner";
import { useHydrated } from "@/lib/useHydrated";

export default function CurriculumPage() {
  const hydrated = useHydrated();
  const [state, setState] = useState<LearnerState | null>(null);
  const learner = state ?? (hydrated ? loadLearnerState() : null);
  if (!learner) return <p className="animate-pulse text-sm opacity-60">Loading…</p>;

  const unit = getUnit(learner.currentUnit)!;
  const currentIdx = unitIndex(learner.currentUnit);
  const gate = canAdvance(learner);
  const checks = learner.canDoChecks[unit.id] ?? unit.canDo.map(() => false);
  const nextSeed = pickSeed(unit.id, learner.lastSeedId);
  const level = defaultLevelForUnit(unit.id);

  const update = (next: LearnerState) => {
    saveLearnerState(next);
    setState(next);
  };

  const toggleCanDo = (i: number) => {
    const nextChecks = [...checks];
    nextChecks[i] = !nextChecks[i];
    update({ ...learner, canDoChecks: { ...learner.canDoChecks, [unit.id]: nextChecks } });
  };

  const advance = (override: boolean) => {
    if (override && !window.confirm("Force-advance past the gate? This will be logged.")) return;
    update(advanceUnit(learner, { override, ts: Date.now() }));
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Curriculum</h1>

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-semibold">
          Now learning: {unit.id} — {unit.title}
        </h2>
        <ul className="mt-2 space-y-1 text-sm">
          {unit.grammarTargets.map((t) => (
            <li key={t.id}>
              <span className="font-medium">{t.id}</span>: {t.pattern}
              <span className="opacity-60"> — {t.exampleFrames.join(" · ")}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm opacity-70">Vocab: {unit.vocab.map((v) => v.tl).join(", ")}</p>
        <p className="mt-1 text-sm opacity-70">{unit.registerNotes.join(" ")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {nextSeed && (
            <Link
              href={`/practice/seed?seed=${nextSeed.id}&mode=target&level=${level}`}
              className="rounded-full bg-(--accent) px-4 py-1.5 text-sm text-white"
            >
              🎬 Start Target Scene — {nextSeed.setting}
            </Link>
          )}
          {nextSeed && (
            <Link
              href={`/practice/seed?seed=${nextSeed.id}&mode=review&level=${level}`}
              className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
            >
              ⚡ Review sprint
            </Link>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-semibold">Can-do checklist</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {unit.canDo.map((c, i) => (
            <li key={c}>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={checks[i] ?? false} onChange={() => toggleCanDo(i)} />
                {c}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="font-semibold">Advance to the next unit</h2>
        {gate.ok ? (
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">Gate open — solid work.</p>
        ) : (
          <ul className="mt-1 list-inside list-disc text-sm opacity-80">
            {gate.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => advance(false)}
            disabled={!gate.ok || currentIdx === CURRICULUM.length - 1}
            className="rounded-full bg-(--accent) px-4 py-1.5 text-sm text-white disabled:opacity-40"
          >
            Advance ➜
          </button>
          {!gate.ok && currentIdx < CURRICULUM.length - 1 && (
            <button
              onClick={() => advance(true)}
              className="rounded-full border border-black/20 px-4 py-1.5 text-sm opacity-70 dark:border-white/20"
            >
              Force-advance (logged)
            </button>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">All units</h2>
        <ol className="mt-2 space-y-1 text-sm">
          {CURRICULUM.map((u, i) => (
            <li
              key={u.id}
              className={
                i === currentIdx
                  ? "font-semibold text-accent"
                  : i < currentIdx
                    ? "opacity-60 line-through"
                    : "opacity-60"
              }
            >
              {u.id} — {u.title}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Current-unit banner on the home page**

In `app/page.tsx`, after the Taglish dial section (import `Link` from `next/link`, `loadLearnerState` from `@/lib/learner`, `getUnit` from `@/lib/curriculum`; page already has `hydrated`):

```tsx
      {hydrated && (() => {
        const unit = getUnit(loadLearnerState().currentUnit);
        return unit ? (
          <Link
            href="/curriculum"
            className="rounded-xl border border-black/10 p-4 transition hover:border-accent dark:border-white/10"
          >
            <span className="text-sm opacity-70">Now learning</span>
            <div className="font-semibold">
              {unit.id} — {unit.title}
            </div>
          </Link>
        ) : null;
      })()}
```

- [ ] **Step 3: Nav link**

Read `app/layout.tsx`; add a `Curriculum` link to `/curriculum` styled identically to the existing `Vocab`/`Sessions` links.

- [ ] **Step 4: Typecheck + manual verification**

Run: `npx tsc --noEmit && npx vitest run` — expected clean.

Manual: visit `/curriculum` — u01 shown; Start Target Scene links to `s-tawag-lola` (first seed); gate blocked with reasons; can-do checkboxes persist across reload; force-advance moves to u02 with `overrides` logged. After a target session, revisit — the Start link rotates to `s-bagong-kapitbahay`. Reset afterwards: `localStorage.removeItem("kausap.learner")`.

- [ ] **Step 5: Commit**

```bash
git add app/curriculum app/page.tsx app/layout.tsx
git commit -m "feat: curriculum page with seed rotation, can-do checklist, and advisory advancement gate"
```

---

### Task 10: M4 Lia Prep (API route + card page)

**Files:**
- Create: `app/api/lia-prep/route.ts`
- Create: `app/lia-prep/page.tsx`
- Modify: `app/curriculum/page.tsx` (link in the current-unit button row)

**Interfaces:**
- Consumes: `getUnit` (Task 2); `API_BASE_URL`, `authHeaders`, `getApiKey` (existing `lib/openai-server.ts`).
- Produces: POST `/api/lia-prep` `{ currentUnit: string }` → `{ prompts: { tagalog: string; english: string }[] }` (3–5 items).

- [ ] **Step 1: Create the API route**

```ts
// app/api/lia-prep/route.ts
import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL, authHeaders, getApiKey } from "@/lib/openai-server";
import { getUnit } from "@/lib/curriculum";

const MODEL = process.env.FEEDBACK_MODEL ?? "gpt-4o-mini";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["prompts"],
  properties: {
    prompts: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tagalog", "english"],
        properties: {
          tagalog: { type: "string", description: "A conversation prompt in Tagalog the learner can say at the dinner table." },
          english: { type: "string", description: "English gloss of the prompt." },
        },
      },
    },
  },
};

export async function POST(req: NextRequest) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "No API key set." }, { status: 500 });
  }
  const body = await req.json().catch(() => ({}));
  const unit = typeof body.currentUnit === "string" ? getUnit(body.currentUnit) : undefined;
  if (!unit) return NextResponse.json({ error: "Unknown unit." }, { status: 400 });

  const res = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You write short Tagalog conversation starters for a heritage learner to use with " +
            "their Filipina wife at a family dinner with young kids present. Prompts must use ONLY " +
            "grammar the learner has acquired (described below), sound natural and warm — questions " +
            "that invite stories, not quiz items. Original content only.",
        },
        {
          role: "user",
          content:
            `Current unit ${unit.id}: ${unit.title}. Grammar targets: ` +
            unit.grammarTargets.map((t) => `${t.pattern} (frames: ${t.exampleFrames.join(" | ")})`).join("; ") +
            `. Unit vocab: ${unit.vocab.map((v) => v.tl).join(", ")}. ` +
            `Register notes: ${unit.registerNotes.join(" ")} ` +
            `Write 3-5 dinner-table prompts exercising this unit's grammar.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "lia_prep", strict: true, schema: SCHEMA },
      },
    }),
  });

  if (!res.ok) {
    console.error("lia-prep failed:", res.status, await res.text());
    return NextResponse.json({ error: `Generation failed (${res.status}).` }, { status: 502 });
  }
  const data = await res.json();
  try {
    return NextResponse.json(JSON.parse(data.choices[0].message.content));
  } catch {
    return NextResponse.json({ error: "Could not parse prompts." }, { status: 502 });
  }
}
```

- [ ] **Step 2: Create the card page**

```tsx
// app/lia-prep/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { getUnit } from "@/lib/curriculum";
import { loadLearnerState } from "@/lib/learner";
import { useHydrated } from "@/lib/useHydrated";

interface Prompt { tagalog: string; english: string }

export default function LiaPrepPage() {
  const hydrated = useHydrated();
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const unit = hydrated ? getUnit(loadLearnerState().currentUnit) : undefined;

  const generate = async () => {
    setState("loading");
    setPrompts(null);
    try {
      const res = await fetch("/api/lia-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentUnit: loadLearnerState().currentUnit }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { prompts: Prompt[] };
      setPrompts(data.prompts);
      setState("idle");
    } catch {
      setState("error");
    }
  };

  const copy = async () => {
    if (!prompts) return;
    await navigator.clipboard.writeText(
      prompts.map((p) => `• ${p.tagalog}\n  (${p.english})`).join("\n")
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">🍽️ Lia Prep</h1>
        <p className="mt-1 text-sm opacity-70">
          Dinner-table conversation starters from your current unit
          {unit ? ` (${unit.id} — ${unit.title})` : ""}. Use them tonight.
        </p>
      </div>

      <button
        onClick={generate}
        disabled={state === "loading" || !unit}
        className="self-start rounded-full bg-(--accent) px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
      >
        {state === "loading" ? "Thinking…" : prompts ? "Regenerate" : "Generate prompts"}
      </button>

      {state === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">Could not generate — try again.</p>
      )}

      {prompts && (
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <ul className="space-y-3">
            {prompts.map((p) => (
              <li key={p.tagalog}>
                <p className="font-medium">{p.tagalog}</p>
                <p className="text-sm opacity-60">{p.english}</p>
              </li>
            ))}
          </ul>
          <button
            onClick={copy}
            className="mt-4 rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
          >
            {copied ? "✓ Copied" : "📋 Copy card"}
          </button>
        </div>
      )}

      <Link href="/curriculum" className="text-sm text-accent underline">
        ← Back to curriculum
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Link from the curriculum page**

In `app/curriculum/page.tsx`, in the current-unit button row:

```tsx
          <Link
            href="/lia-prep"
            className="rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
          >
            🍽️ Lia Prep
          </Link>
```

- [ ] **Step 4: Typecheck + verify**

Run: `npx tsc --noEmit` — clean.

```bash
curl -s -X POST http://localhost:3000/api/lia-prep -H 'Content-Type: application/json' \
  -d '{"currentUnit":"u03"}' | python3 -m json.tool
```

Expected: 3–5 prompts, each Tagalog + English, using only mag-verb-level grammar (spot-check: no object-focus forms like `kakainin`).

Manual: `/lia-prep` page generates and copies a card.

- [ ] **Step 5: Commit**

```bash
git add app/api/lia-prep app/lia-prep app/curriculum/page.tsx
git commit -m "feat: Lia Prep — dinner-table prompt cards from the current unit"
```

---

### Task 11: Weekly status export (D7)

**Files:**
- Create: `lib/exportStatus.ts`
- Test: `lib/__tests__/exportStatus.test.ts`
- Modify: `app/curriculum/page.tsx` (export button)

**Interfaces:**
- Consumes: `LearnerState`, `topErrorTags` (Task 4); `getUnit` (Task 2); `dueItems` (Task 3).
- Produces: `buildStatusMarkdown(state: LearnerState, now: number): string`

- [ ] **Step 1: Write failing test**

```ts
// lib/__tests__/exportStatus.test.ts
import { describe, it, expect } from "vitest";
import { buildStatusMarkdown } from "@/lib/exportStatus";
import { defaultLearnerState, logSession, recordCorrections } from "@/lib/learner";

const WEEK = 7 * 24 * 60 * 60 * 1000;

describe("status export", () => {
  it("renders current unit, weekly sessions, target scores, top errors, and vocab counts", () => {
    let s = defaultLearnerState();
    const now = 1_700_000_000_000;
    s = logSession(s, { ts: now - 1000, mode: "target", unitId: "u01", corrections: 2, durationMin: 10, drillScores: { "g-po-opo": 85 } });
    s = logSession(s, { ts: now - WEEK - 1000, mode: "free", unitId: "u01", corrections: 1, durationMin: 8 }); // outside week
    s = recordCorrections(s, [{ learnerSaid: "kumusta ka po", target: "kumusta po kayo", patternTag: "g-po-opo" }], "u01", now);
    s = { ...s, vocabSrs: { kumusta: { box: 1, due: now - 1, lapses: 0 }, mabuti: { box: 3, due: now + WEEK, lapses: 0 } } };

    const md = buildStatusMarkdown(s, now);
    expect(md).toContain("# Kausap status");
    expect(md).toContain("u01");
    expect(md).toContain("Sessions this week: 1");
    expect(md).toContain("g-po-opo");
    expect(md).toContain("85");
    expect(md).toContain("Due now: 1");
  });
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `npx vitest run lib/__tests__/exportStatus.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```ts
// lib/exportStatus.ts
/** D7: one-click markdown status summary for pasting into a Claude chat. */
import { getUnit } from "./curriculum";
import { dueItems } from "./srs";
import { topErrorTags, type LearnerState } from "./learner";

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function buildStatusMarkdown(state: LearnerState, now: number): string {
  const unit = getUnit(state.currentUnit);
  const week = state.sessionLog.filter((s) => s.ts >= now - WEEK);
  const lastTarget = [...state.sessionLog].reverse().find((s) => s.mode === "target" && s.drillScores);
  const due = dueItems(state.vocabSrs, now, 1000).length;
  const total = Object.keys(state.vocabSrs).length;
  const checks = unit ? (state.canDoChecks[unit.id] ?? []) : [];

  return [
    `# Kausap status — ${new Date(now).toISOString().slice(0, 10)}`,
    ``,
    `**Current unit:** ${unit ? `${unit.id} — ${unit.title}` : state.currentUnit}`,
    `**Completed units:** ${state.completedUnits.join(", ") || "none yet"}`,
    ``,
    `**Sessions this week: ${week.length}** (${week.map((s) => s.mode).join(", ") || "—"})`,
    ``,
    `## Latest Target Scene scores`,
    lastTarget
      ? Object.entries(lastTarget.drillScores!)
          .map(([t, sc]) => `- ${t}: ${sc}/100`)
          .join("\n")
      : "- no Target Scenes yet",
    ``,
    `## Top error patterns`,
    topErrorTags(state, 3)
      .map((e) => `- ${e.patternTag} ×${e.count} (e.g. "${e.examples[0]?.learnerSaid ?? ""}" → "${e.examples[0]?.target ?? ""}")`)
      .join("\n") || "- clean ledger",
    ``,
    `## Vocab`,
    `- Tracked: ${total} · Due now: ${due}`,
    ``,
    `## Can-do (current unit)`,
    unit
      ? unit.canDo.map((c, i) => `- [${checks[i] ? "x" : " "}] ${c}`).join("\n")
      : "-",
  ].join("\n");
}
```

- [ ] **Step 4: Run test, verify pass; add the button**

Run: `npx vitest run lib/__tests__/exportStatus.test.ts` — expected pass.

In `app/curriculum/page.tsx`, import `buildStatusMarkdown` and add near the page title:

```tsx
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(buildStatusMarkdown(learner, Date.now()));
          window.alert("Status copied — paste it into a Claude chat.");
        }}
        className="self-start rounded-full border border-black/20 px-4 py-1.5 text-sm dark:border-white/20"
      >
        📤 Share status with Claude
      </button>
```

- [ ] **Step 5: Typecheck + full test run**

Run: `npx tsc --noEmit && npx vitest run` — expected clean.

- [ ] **Step 6: Commit**

```bash
git add lib/exportStatus.ts lib/__tests__/exportStatus.test.ts app/curriculum/page.tsx
git commit -m "feat: weekly status export as pasteable markdown"
```

---

### Task 12: Acceptance verification (v1.1 criteria) + README

**Files:**
- Modify: `README.md` (curriculum section)

- [ ] **Step 1: Verify acceptance criteria (spec v1.1)**

1. **Instructions + invariants:** `git diff master..HEAD -- lib/scenarios.ts` shows ONLY the three wife-scenario additions from the earlier commit — zero changes to `buildInstructions()`, the accent spec, recast rules, Taglish policy, or lifeline text (byte-identical invariant). Then mint an M1 session (`seedId: s-adobo, mode: target, currentUnit: u06`) and confirm via a temporary `console.log` of the assembled instructions (removed after checking) that the unit payload blocks are appended after the untouched base instructions.
2. **Feedback schema + code-switching:** the Task 7 fixtures pass — patternTags only from the controlled vocabulary, and the Taglish-heavy fixture yields **zero corrections** (zero tags on pure code-switching).
3. **Round-trip:** after a real session, corrections render as chips and aggregate in `errorLedger` by patternTag; vocab lands in `kausap.vocab` and (after unit advance) `vocabSrs`.
4. **M3 SRS:** seed `vocabSrs` in devtools with one due and one future item; a review sprint probes only the due item; its box updates after the report.
5. **Gate:** fresh state blocks with reasons; synthetic data (can-dos checked + two ≥80 target reports + clean top-3) opens it; force-advance appends to `overrides`.
6. **Export:** button produces clean markdown that pastes correctly.
7. **Copyright:** `grep -ri "tuttle\|domigpe\|domingo" lib/ app/` returns nothing; all curriculum strings authored fresh in Task 2.

Record any failures, fix, and re-verify before proceeding.

- [ ] **Step 2: README section**

Add to `README.md` a `## Curriculum mode` section describing: the 10-unit spine with scene seeds, the three session modes (Target scene / Free scene / Review sprint), the advancement gate, Lia Prep, and the status export — 10–15 lines, in the README's existing voice.

- [ ] **Step 3: Full check + commit**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: all clean.

```bash
git add README.md
git commit -m "docs: document curriculum mode, scene seeds, gate, Lia Prep, and status export"
```

---

## Spec-coverage self-review (v1.1)

- **Invariants** → Global Constraints + Task 6 append-only wiring + Task 12 criterion 1 diff-verification. No task touches `lib/scenarios.ts` or `lib/openai-server.ts`.
- D1 curriculum + scene seeds → Task 2 (TS module, spec schema field-for-field in camelCase, ≥2 seeds/unit with the adobo reference seed; persona/voice/opening flagged as app-side seed extensions).
- D2 learner state + reconciliation → reported to Will (localStorage, client-side, single-device caveat accepted); Task 4.
- D3 blocks 1–4 (elicitation goals, soft scope, recycling, error focus) → Task 5; seed rotation (never repeat last) → Tasks 2 (pickSeed), 8 (lastSeedId), 9 (rotating link).
- D4 M1 target/M2 free → Tasks 5–9; M3 review (voice-first per D4) → Tasks 5, 7, 8; M4 Lia Prep (text) → Task 10.
- D5 feedback extension → Task 7 (controlled vocabulary = target ids + the five generic tags; per-target scores with one-line justifications; code-switching-never-tagged restated in the prompt AND fixture-tested). Field names kept as-built (`youSaid`/`better`/`note` + new `patternTag`) since D5 extends the existing schema.
- D6 gate → Tasks 4, 9 (scores sourced from M1 reports; advisory-with-override, logged).
- D7 export → Task 11.
- Acceptance 1–7 → Task 12.
- Out of scope respected: no accent/voice tuning, no provider migration, no UI redesign, no authoring UI, no runtime unit generation, no multi-user.
- Open decisions honored: u01–u10 stubs for Will to map; M3 built voice-first (text-first variant open); kid-difficulty Lia Prep deferred.
