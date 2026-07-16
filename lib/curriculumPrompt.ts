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
## Recycle from earlier units

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
  } else if (ctx.mode === "review" && (ctx.reviewItems ?? []).length > 0) {
    mode = `
## Session mode: REVIEW SPRINT (about 5 minutes)

Run the scene as a quick, playful game. Create brisk natural moments that force the learner to recall and USE each of these items: ${(ctx.reviewItems ?? []).join(", ")}.
One item per exchange, warm energy. Do not define a word for them unless they fail twice.`;
  }

  const pronunciation = `
## Pronunciation (you can hear the learner)

At most once or twice per session, when the learner's pronunciation of a Tagalog word would sound off to a family member — wrong syllable stress, reduced vowels, a dropped final glottal stop — echo that word correctly and naturally inside your in-character recast, with slight emphasis. Never lecture about pronunciation; the echo IS the correction.`;

  return [payload, scope, recycling, errorFocus, mode, pronunciation].filter(Boolean).join("\n");
}
