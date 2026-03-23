import type { Page } from "playwright";

export class PlaywrightController {
  public async openUrl(page: Page, url: string, timeout: number): Promise<{ url: string; title: string }> {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    return {
      url: page.url(),
      title: await page.title()
    };
  }

  public async click(page: Page, selector: string, timeout: number): Promise<{ clicked: boolean; selector: string }> {
    await page.locator(selector).click({ timeout });
    return { clicked: true, selector };
  }

  public async fillForm(
    page: Page,
    fields: Array<{ selector: string; value: string }>,
    timeout: number
  ): Promise<{ filled: number }> {
    for (const field of fields) {
      await page.locator(field.selector).fill(field.value, { timeout });
    }
    return { filled: fields.length };
  }

  public async screenshot(page: Page): Promise<{ mimeType: string; data: string }> {
    const buffer = await page.screenshot({ type: "png", fullPage: true });
    return {
      mimeType: "image/png",
      data: buffer.toString("base64")
    };
  }

  public async scrapeData(
    page: Page,
    selector: string,
    attribute?: string
  ): Promise<{ selector: string; text?: string; html: string | null; attribute?: string | null }> {
    const locator = page.locator(selector).first();
    const html = await locator.evaluate((element) => element.outerHTML);
    if (attribute) {
      return {
        selector,
        attribute: await locator.getAttribute(attribute),
        html
      };
    }

    return {
      selector,
      text: await locator.innerText(),
      html
    };
  }

  public async downloadFile(page: Page, url: string, timeout: number): Promise<{ url: string; suggestedFilename: string }> {
    const downloadPromise = page.waitForEvent("download", { timeout });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    const download = await downloadPromise;
    return {
      url,
      suggestedFilename: download.suggestedFilename()
    };
  }

  public async uploadFile(page: Page, selector: string, filePath: string, timeout: number): Promise<{ uploaded: boolean }> {
    await page.setInputFiles(selector, filePath, { timeout });
    return { uploaded: true };
  }

  public async loginSession(
    page: Page,
    input: {
      url: string;
      usernameSelector: string;
      passwordSelector: string;
      submitSelector: string;
      username: string;
      password: string;
    },
    timeout: number
  ): Promise<{ loggedIn: boolean; url: string }> {
    await page.goto(input.url, { waitUntil: "domcontentloaded", timeout });
    await page.locator(input.usernameSelector).fill(input.username, { timeout });
    await page.locator(input.passwordSelector).fill(input.password, { timeout });
    await page.locator(input.submitSelector).click({ timeout });
    await page.waitForLoadState("networkidle", { timeout });
    return {
      loggedIn: true,
      url: page.url()
    };
  }
}
