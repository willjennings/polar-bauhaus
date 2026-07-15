import { describe, it, expect } from "vitest";
import { getScenario } from "@/lib/scenarios";

describe("test infra", () => {
  it("resolves @/ alias and runs", () => {
    expect(getScenario("cooking")?.id).toBe("cooking");
  });
});
