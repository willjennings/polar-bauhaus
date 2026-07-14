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
                <p className="mt-1 text-xs opacity-70">{c.note}</p>
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

      <p className="text-sm font-medium text-accent">{feedback.encouragement}</p>
    </div>
  );
}
