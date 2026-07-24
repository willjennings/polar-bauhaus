/** D7: one-click markdown status summary for pasting into a Claude chat. */
import { getUnit } from "./curriculum";
import { dueCount } from "./srs";
import { topErrorTags, type LearnerState } from "./learner";

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function buildStatusMarkdown(state: LearnerState, now: number): string {
  const unit = getUnit(state.currentUnit);
  const week = state.sessionLog.filter((s) => s.ts >= now - WEEK);
  const lastTarget = [...state.sessionLog].reverse().find((s) => s.mode === "target" && s.drillScores);
  const due = dueCount(state.vocabSrs, now);
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
