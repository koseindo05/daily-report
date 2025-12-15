import { describe, it, expect } from "vitest";

describe("Sample Test", () => {
  it("should pass", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string comparison", () => {
    expect("hello").toBe("hello");
  });
});
