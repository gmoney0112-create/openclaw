import { config } from '../config.js';

const API_URL = 'https://api.vercel.com';

function headers(): Record<string, string> {
  if (!config.vercel.token) {
    throw new Error('VERCEL_TOKEN is required. Create one at vercel.com → Settings → Tokens.');
  }
  return {
    Authorization: `Bearer ${config.vercel.token}`,
    'Content-Type': 'application/json',
  };
}

export interface LandingPageOptions {
  title: string;
  subtitle: string;
  videoEmbedUrl?: string;
  ctaText?: string;
  ctaHref?: string;
  /** Hex color for the primary CTA button. */
  primaryColor?: string;
}

/**
 * Deploy a minimal lead-capture landing page to Vercel.
 * Returns the production URL.
 */
export async function deployLandingPage(opts: LandingPageOptions): Promise<string> {
  const html = buildLandingHtml(opts);

  const payload = {
    name: config.vercel.projectName,
    files: [
      {
        file: 'index.html',
        data: Buffer.from(html).toString('base64'),
        encoding: 'base64',
      },
    ],
    projectSettings: { framework: null },
    target: 'production',
  };

  const teamQuery = config.vercel.orgId ? `?teamId=${config.vercel.orgId}` : '';
  const resp = await fetch(`${API_URL}/v13/deployments${teamQuery}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Vercel deploy failed: ${resp.status} ${err}`);
  }

  const data = (await resp.json()) as { url: string; id: string };
  return `https://${data.url}`;
}

function buildLandingHtml(opts: LandingPageOptions): string {
  const color = opts.primaryColor ?? '#0f172a';
  const cta = opts.ctaText ?? 'Subscribe for more';
  const href = opts.ctaHref ?? '#subscribe';
  const videoBlock = opts.videoEmbedUrl
    ? `<div class="video-wrap"><iframe src="${opts.videoEmbedUrl}" frameborder="0" allowfullscreen></iframe></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(opts.title)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#fff;color:#1e293b;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem}
  h1{font-size:2rem;font-weight:700;line-height:1.2;max-width:640px;text-align:center}
  p{margin-top:1rem;font-size:1.1rem;color:#475569;max-width:520px;text-align:center}
  .cta{margin-top:2rem;background:${color};color:#fff;padding:0.875rem 2rem;border-radius:0.5rem;font-size:1rem;font-weight:600;text-decoration:none;display:inline-block}
  .cta:hover{opacity:0.9}
  .video-wrap{margin-top:2rem;width:100%;max-width:640px;aspect-ratio:16/9}
  .video-wrap iframe{width:100%;height:100%}
  form{margin-top:2rem;display:flex;gap:0.5rem;flex-wrap:wrap;justify-content:center}
  input[type=email]{padding:0.75rem 1rem;border:1px solid #cbd5e1;border-radius:0.5rem;font-size:1rem;flex:1;min-width:220px}
  button[type=submit]{background:${color};color:#fff;padding:0.75rem 1.5rem;border:none;border-radius:0.5rem;font-size:1rem;font-weight:600;cursor:pointer}
</style>
</head>
<body>
<h1>${escHtml(opts.title)}</h1>
<p>${escHtml(opts.subtitle)}</p>
${videoBlock}
<div id="subscribe">
<form onsubmit="handleSubmit(event)">
  <input type="email" placeholder="your@email.com" required>
  <button type="submit">${escHtml(cta)}</button>
</form>
</div>
<script>
function handleSubmit(e){
  e.preventDefault();
  const email=e.target.querySelector('input').value;
  fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})})
    .then(()=>{ document.getElementById('subscribe').innerHTML='<p>You are in! Check your inbox.</p>'; })
    .catch(()=>{ document.getElementById('subscribe').innerHTML='<p>Subscribed!</p>'; });
}
</script>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
