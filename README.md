# Hero of Legend

A Breath of the Wild–inspired **16-bit pixel art** landing page for [herooflegend.com](https://herooflegend.com), featuring a Zelda II NES–style intro cinematic and an engagement-focused contact form.

## Features

- **Intro sequence** — Dark starfield, rising castle silhouette, narrative text crawl, optional chiptune audio
- **BOTW aesthetic** — Sage greens, sky blues, Sheikah orange glow, pixel UI chrome
- **Quest Log form** — Asks *"What quest are you on?"* without exposing the hero's email
- **Cloudflare Worker** — Optional backend for email delivery via Cloudflare Email Service

## Local Preview

Static files only (no Worker):

```bash
cd HeroOfLegend
npm run preview
# Open http://localhost:3000
```

With Worker + static assets (form delivery works when configured):

```bash
npm install
npm run dev
# Open http://localhost:8787
```

## Contact Form

The form collects:

| Field | Purpose |
|-------|---------|
| Adventurer Name | Who is reaching out |
| Return Path | Submitter's email (used as `replyTo`) |
| What quest are you on? | Main engagement message |

Submissions POST to `/api/contact`. The recipient address (`Link@herooflegend.com`) is stored as a Worker secret — never in client code.

## Deployment (Cloudflare)

1. **Enable email sending** on your domain:
   ```bash
   npx wrangler email sending enable herooflegend.com
   ```

2. **Set the contact secret:**
   ```bash
   npx wrangler secret put CONTACT_TO
   # Enter: Link@herooflegend.com
   ```

3. **Deploy:**
   ```bash
   npm install
   npm run deploy
   ```

4. Verify SPF/DKIM records in the Cloudflare dashboard for deliverability.

## Project Structure

```
HeroOfLegend/
├── index.html          # Landing page + intro overlay
├── css/styles.css      # BOTW 16-bit theme
├── js/
│   ├── intro.js        # Zelda II-style intro animation
│   ├── audio.js        # Procedural chiptune audio
│   ├── form.js         # Contact form logic
│   └── main.js         # Page interactions
├── assets/sprites/     # Original pixel SVG art
├── worker/index.ts     # Contact API + email relay
└── wrangler.jsonc      # Cloudflare Worker config
```

## Legal Note

All visual assets, copy, and audio are **original creations** inspired by the Legend of Zelda aesthetic. No Nintendo copyrighted assets are used.