import { Resend } from 'resend';
import { config } from '../config.js';

let _client: Resend | null = null;

function client(): Resend {
  if (!config.resend.apiKey) {
    throw new Error('RESEND_API_KEY is required. Sign up at resend.com.');
  }
  if (!_client) _client = new Resend(config.resend.apiKey);
  return _client;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export interface BroadcastOptions {
  recipients: string[];
  subject: string;
  /** Handlebars-style HTML template. Use {{name}}, {{cta_url}} etc. */
  htmlTemplate: string;
  templateVars?: Record<string, string>;
}

/** Send a single transactional email. */
export async function sendEmail(opts: EmailOptions): Promise<string> {
  const { data, error } = await client().emails.send({
    from: config.resend.fromEmail,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    reply_to: opts.replyTo,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data?.id ?? '';
}

/** Broadcast an email blast to a list of recipients with template variable substitution. */
export async function broadcast(opts: BroadcastOptions): Promise<number> {
  const vars = opts.templateVars ?? {};
  let sent = 0;

  // Resend doesn't have a native batch API in all plans; send sequentially with slight delay
  for (const recipient of opts.recipients) {
    const html = Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, v),
      opts.htmlTemplate,
    );

    await sendEmail({ to: recipient, subject: opts.subject, html });
    sent++;
    await sleep(200); // stay within rate limits
  }

  return sent;
}

/** Build a lead-capture confirmation email for new subscribers. */
export function confirmationEmail(landingPageUrl: string): string {
  return `
<div style="font-family:sans-serif;max-width:600px;margin:auto">
  <h2>You're in!</h2>
  <p>Thanks for subscribing. We'll send you our latest content as soon as it drops.</p>
  <p><a href="${landingPageUrl}" style="background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">Watch the latest →</a></p>
</div>`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
