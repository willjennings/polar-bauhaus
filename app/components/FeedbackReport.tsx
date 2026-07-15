import type { Feedback } from "@/lib/types";

export default function FeedbackReport({ feedback }: { feedback: Feedback }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-black/10 p-5 dark:border-white/10">
      <div>
        <h2 className="font-semibold">How it went</h2>
        <p className="mt-1 text-sm opacity-80">{feedback.summary}</p>
      </div>

      {feedback.wins && feedback.wins.length > 0 && (
        <div>
          <h2 className="font-semibold">What landed 💪</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {feedback.wins.map((w, i) => (
              <li key={i} className="text-sm opacity-80">
                ✓ {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.corrections.length > 0 && (
        <div>
          <h2 className="font-semibold">You could also say</h2>
          <ul className="mt-2 flex flex-col gap-3">
            {feedback.corrections.map((c, i) => (
              <li key={i} className="rounded-lg bg-black/5 p-3 text-sm dark:bg-white/5">
                <p className="opacity-70">You said: {c.youSaid}</p>
                <p className="mt-0.5 font-medium text-accent-warm">Also works: {c.better}</p>
                <p className="mt-1 text-xs opacity-70">
                  {c.note}
                  {c.patternTag && (
                    <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-xs opacity-70 dark:bg-white/10">
                      {c.patternTag}
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.vocab.length > 0 && (
        <div>
          <h2 className="font-semibold">New words — saved to your vocab</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {feedback.vocab.map((v, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{v.tagalog}</span>
                <span className="opacity-70"> — {v.english}</span>
                <span className="block text-xs italic opacity-60">{v.example}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.drillScores && feedback.drillScores.length > 0 && (
        <div>
          <h2 className="font-semibold">🎬 Target scores</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {feedback.drillScores.map((d) => (
              <li key={d.targetId} className="text-sm">
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
        </div>
      )}

      <p className="text-sm font-medium text-accent">{feedback.encouragement}</p>
    </div>
  );
}
