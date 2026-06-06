import * as vercelTool from '../tools/vercel.js';
import * as resendTool from '../tools/resend.js';
import * as notionTool from '../tools/notion.js';
import { config } from '../config.js';
import type { PipelineState, Script, FinalVideo, DistributionResult } from '../types.js';

/**
 * Phase 5: Distribute — deploy landing page, email subscribers, log to Notion.
 */
export async function runDistribute(
  state: PipelineState,
  script: Script,
  video: FinalVideo,
  subscriberEmails: string[] = [],
): Promise<DistributionResult> {
  const result: DistributionResult = {};

  // 1. Deploy landing page (Vercel)
  if (config.vercel.token) {
    try {
      result.landingPageUrl = await vercelTool.deployLandingPage({
        title: script.title,
        subtitle: script.hook,
        ctaText: 'Subscribe for more content',
        primaryColor: '#0f172a',
      });
      console.log(`  Landing page: ${result.landingPageUrl}`);
    } catch (err) {
      console.warn(`  Vercel deploy skipped: ${(err as Error).message}`);
    }
  }

  // 2. Email existing subscribers
  if (config.resend.apiKey && subscriberEmails.length > 0) {
    try {
      const html = resendTool.confirmationEmail(result.landingPageUrl ?? '#');
      const count = await resendTool.broadcast({
        recipients: subscriberEmails,
        subject: `New video: ${script.title}`,
        htmlTemplate: html,
      });
      result.emailsSent = count;
      console.log(`  Emails sent: ${count}`);
    } catch (err) {
      console.warn(`  Email broadcast skipped: ${(err as Error).message}`);
    }
  }

  // 3. Log to Notion content calendar
  if (config.notion.apiKey && config.notion.calendarDatabaseId) {
    try {
      const entry = notionTool.entryFromScript(script);
      if (result.landingPageUrl) entry.landingPageUrl = result.landingPageUrl;
      entry.status = 'Ready';

      const { id, url } = await notionTool.addEntry(entry);
      result.notionEntryId = id;
      result.notionEntryUrl = url;
      console.log(`  Notion entry: ${url}`);
    } catch (err) {
      console.warn(`  Notion skipped: ${(err as Error).message}`);
    }
  }

  return result;
}
