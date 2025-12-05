import { STANDARD_LOAN_DAYS } from "./LoanRules";

describe("LoanRules Constants", () => {
  it("should have STANDARD_LOAN_DAYS defined", () => {
    expect(STANDARD_LOAN_DAYS).toBeDefined();
    expect(typeof STANDARD_LOAN_DAYS).toBe("number");
  });

  it("should have a reasonable loan period", () => {
    expect(STANDARD_LOAN_DAYS).toBeGreaterThan(0);
    expect(STANDARD_LOAN_DAYS).toBeLessThanOrEqual(90);
  });
});
