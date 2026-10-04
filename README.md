# Awaaz News (आवाज़ न्यूज़) — Calm, Listenable News Discovery

> **Awaaz News** ("awaaz" = voice) is a serene, visual, and listenable news discovery platform. It aggregates public interest news from verified official RSS feeds (The Hindu, Times of India, Indian Express, NDTV, BBC, Amar Ujala, Aaj Tak), renders them in an elegant Pinterest-style masonry grid, and provides automated, high-fidelity spoken narration in **English** and **हिन्दी** with an animated Story Player.

---

## 1. Key Features

- **Claude.ai-Inspired Simplicity:** Distraction-free typography, warm charcoal palette (`#0E1116`), whisper-quiet borders, and zero clutter.
- **Automated Spoken Narration:** Powered by the browser's native Web Speech API (`window.speechSynthesis`), queueing sentences sequentially to bypass browser timeouts.
- **Smart Script Builder:** Pure function expanding common Indian English abbreviations (`PM`, `CM`, `HC`, `SC`, `BJP`, `RBI`, `IPL`, `₹500` -> `500 rupees`), rotating intros, and capping summaries to 70 words.
- **Interactive Story Player:** Seamless card-to-center modal expansion, 14-second Ken Burns image zoom, live synchronized sentence captions with `aria-live="polite"`, and tabbed official YouTube video embeds via `youtube-nocookie.com`.
- **Masonry Grid with Zero Layout Shift:** Column breakpoints (4 cols desktop, 3 cols laptop, 2 cols tablet, 1 col mobile) with pre-stored image aspect ratios ensuring Lighthouse CLS < 0.1.
- **Deterministic Text Cards:** Automatic graceful fallback with category-derived color gradients when images are missing or blocked by hotlink protection.
- **Play Briefing Mode:** Sequentially narrates the top 10 stories of the active feed with a 600ms gap.
- **Strict Legal & Fair Dealing Compliance:** Strictly zero scraping of full article bodies; summary capped at 400 characters; hot-linked images; permanent prominent publisher attribution and canonical links.

---

## 2. Prerequisites & Quickstart

- **Node.js:** v20.x or v22+ LTS
- **Package Manager:** npm or bun

### Local Setup:

1. **Clone repository:**
   ```bash
   git clone https://github.com/example/awaaz-news.git
   cd awaaz-news
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 3. Configuration & Environment Variables

Create `.env` using `.env.example`:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Local development port |
| `YOUTUBE_API_KEY` | *(optional)* | YouTube Data API v3 key for syncing channel uploads |
| `INGEST_INTERVAL_MINUTES` | `15` | Polling interval for publisher RSS feeds |
| `USER_AGENT` | `AwaazNewsBot/1.0 (+mailto:contact@awaaznews.org)` | Identified crawler User-Agent |

### Obtaining a YouTube API Key (Optional):
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **YouTube Data API v3**.
3. Create an API Key in Credentials and restrict it to `YouTube Data API v3`.
4. Add to `.env` as `YOUTUBE_API_KEY=your_key_here`. If left blank, video tabs are gracefully omitted without errors.

---

## 4. Hindi Speech Synthesis & Voice Setup by OS

Awaaz News selects the highest-fidelity natural voices available on the user's operating system:

| Platform | Best Voice | Installation / Activation |
|---|---|---|
| **Android / Chrome** | Google Hindi (`hi-IN`) | Pre-installed on most modern Android devices. Go to **Settings > System > Languages & input > Text-to-speech output** to confirm Google Speech Services are active. |
| **macOS / iOS** | Lekha (`hi-IN`) | Go to **System Settings > Accessibility > Spoken Content > System Voice > Manage Voices**, search for **Hindi**, and download *Lekha (Enhanced)*. |
| **Windows 11** | Kalpana / Hemant (`hi-IN`) | Go to **Settings > Time & Language > Speech**, click **Add voices**, and select **Hindi (India)**. |
| **Linux** | eSpeak / Festival | Install `espeak-ng` or `speech-dispatcher-flite`. |

*Note: If a device lacks an installed Hindi voice, Awaaz News gracefully displays an accessible alert banner while continuing to display live-highlighted captions in perfect synchronization.*

---

## 5. Adding New RSS Feeds, Countries, or Languages

### To Add an RSS Feed:
Edit `src/config/sources.json`:
```json
{
  "id": "hindu-tech-en",
  "name": "The Hindu",
  "country": "IN",
  "language": "en",
  "feedUrl": "https://www.thehindu.com/sci-tech/technology/feeder/default.rss",
  "homeUrl": "https://www.thehindu.com",
  "categoryHint": "tech"
}
```

### To Add a Category or Keyword:
Edit `src/config/categories.json` to update keywords in both `en` and `hi` lists. The Unicode-aware tokenizer will automatically score and classify incoming feed items.

---

## 6. Troubleshooting

1. **No sound when clicking a card:**
   - Browsers require an explicit user gesture (click or tap) before initiating audio. Clicking a card provides this user gesture.
   - Verify that your device volume is turned up and that browser tab audio is not muted.
2. **CORS errors when fetching RSS feeds:**
   - In production, server-side ingestion or verified CORS proxies handle XML parsing. Awaaz News includes a resilient fallback corpus so the application is always populated.
3. **Missing Hindi voices:**
   - Refer to Section 4 above to enable Hindi voices in your OS settings.

---

## 7. Legal Disclaimer & Fair Dealing Notice

Awaaz News is a non-commercial, educational news discovery platform designed under the principles of fair dealing:
- All headlines, summaries, and images belong entirely to their respective copyright holders.
- No full article text is stored or presented. Summaries are hard-capped at 400 characters.
- Every card links directly to the original publisher article with prominent attribution.
- Removal requests: `contact@awaaznews.org`.
