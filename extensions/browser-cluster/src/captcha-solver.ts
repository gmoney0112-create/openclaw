export class CaptchaSolver {
  public async solve(siteKey: string, pageUrl: string): Promise<{ token: string; provider: string }> {
    const apiKey = process.env.CAPTCHA_API_KEY;
    if (!apiKey) {
      throw new Error("CAPTCHA_API_KEY is not configured.");
    }

    const moduleRef = await import("2captcha-ts");
    const Solver = (moduleRef as Record<string, unknown>).Solver as
      | (new (key: string) => { recaptcha: (input: { googlekey: string; pageurl: string }) => Promise<{ data: string }> })
      | undefined;

    if (!Solver) {
      throw new Error("2captcha-ts Solver export was not available.");
    }

    const solver = new Solver(apiKey);
    const result = await solver.recaptcha({
      googlekey: siteKey,
      pageurl: pageUrl
    });

    return {
      token: result.data,
      provider: "2captcha"
    };
  }
}
