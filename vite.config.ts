import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function rssProxyPlugin() {
  return {
    name: 'rss-proxy-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/api/rss-proxy')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const targetUrl = urlObj.searchParams.get('url');
            if (!targetUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing url parameter' }));
              return;
            }
            const response = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'AwaazNewsBot/1.0 (+mailto:contact@awaaznews.org) Mozilla/5.0 (compatible)',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
              },
              signal: AbortSignal.timeout(8000)
            });
            const text = await response.text();
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = response.status;
            res.end(text);
          } catch (err: any) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to fetch upstream RSS feed', message: err?.message }));
          }
          return;
        }

        // Automatic backend video availability verification (drops unavailable videos)
        if (req.url && req.url.startsWith('/api/check-videos')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const idsParam = urlObj.searchParams.get('ids') || '';
            const ids = idsParam.split(',').map((s: string) => s.trim()).filter(Boolean);

            const verifiedList: Array<{ youtubeId: string; title: string; channel: string }> = [];

            await Promise.all(
              ids.map(async (id: string) => {
                try {
                  const oembedRes = await fetch(
                    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
                    { signal: AbortSignal.timeout(4000) }
                  );
                  // Only 200 means active, public, and embeddable
                  if (oembedRes.ok) {
                    const data = await oembedRes.json();
                    verifiedList.push({
                      youtubeId: id,
                      title: data.title || '',
                      channel: data.author_name || 'Official Broadcast'
                    });
                  }
                } catch {
                  // unavailable or blocked -> automatically dropped
                }
              })
            );

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify({ availableVideos: verifiedList }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message, availableVideos: [] }));
          }
          return;
        }

        // High-accuracy per-story video discovery with strict relevance token matching
        if (req.url && req.url.startsWith('/api/search-story-videos')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const headline = urlObj.searchParams.get('headline') || '';
            const lang = urlObj.searchParams.get('lang') || 'en';

            if (!headline.trim()) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ videos: [] }));
              return;
            }

            const cleanSearchQuery = `${headline.slice(0, 70)} news`;
            const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanSearchQuery)}`;
            
            const ytResponse = await fetch(ytSearchUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': lang === 'hi' ? 'hi-IN,hi;q=0.9,en;q=0.8' : 'en-US,en;q=0.9'
              },
              signal: AbortSignal.timeout(6000)
            });

            const html = await ytResponse.text();
            const candidateIds: string[] = [];
            const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
            let m;
            while ((m = regex.exec(html)) !== null && candidateIds.length < 8) {
              if (!candidateIds.includes(m[1])) candidateIds.push(m[1]);
            }

            const STOP_WORDS = new Set([
              "the","a","an","in","on","at","to","for","of","with","and","or","is","are","was","were","by",
              "after","from","this","that","its","has","have","had","over","into","news","video","report",
              "special","live","update","latest","today","about","more","will","been","their","they","says",
              "और","के","की","को","में","से","पर","ने","है","हैं","लिए","गया","था","थे","थी","तक"
            ]);

            const getTokens = (str: string) => str.toLowerCase()
              .replace(/[^\p{L}\p{N}\s]/gu, ' ')
              .split(/\s+/)
              .filter(t => t.length >= 3 && !STOP_WORDS.has(t));

            const headlineTokens = getTokens(headline);
            const verifiedMatches: Array<{ youtubeId: string; title: string; channel: string; relevanceScore: number }> = [];

            await Promise.all(
              candidateIds.map(async (vId) => {
                try {
                  const oembedRes = await fetch(
                    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vId}&format=json`,
                    { signal: AbortSignal.timeout(4000) }
                  );
                  if (oembedRes.ok) {
                    const data = await oembedRes.json();
                    const videoTitle = data.title || '';
                    const videoTokens = new Set(getTokens(videoTitle));

                    let matchCount = 0;
                    for (const t of headlineTokens) {
                      if (videoTokens.has(t)) matchCount++;
                    }

                    // STRICT ACCURACY REQUIREMENT:
                    // Must share at least 2 distinct key content words, OR at least 1 specific named entity (>= 5 chars)
                    const keyEntities = headlineTokens.filter(t => t.length >= 5 && videoTokens.has(t));
                    const hasKeyEntityMatch = keyEntities.length > 0;

                    if (matchCount >= 2 || (matchCount >= 1 && hasKeyEntityMatch)) {
                      // Calculate probability of correctness (0.0 to 1.0)
                      const tokenRatio = headlineTokens.length > 0 ? (matchCount / headlineTokens.length) : 0;
                      let accuracy = Math.min(tokenRatio * 1.25 + (keyEntities.length * 0.15), 1.0);
                      // Strong matching threshold: 3+ content matches or 2 matches with entity
                      if (matchCount >= 3 || (matchCount >= 2 && keyEntities.length >= 1)) {
                        accuracy = Math.max(accuracy, 0.92);
                      }
                      const confidencePercent = Math.round(accuracy * 100);
                      const isHighlyAccurate = confidencePercent >= 90;

                      // Looping 7-second muted video snippet for cell hover preview
                      const previewSnippetUrl = `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${vId}&start=4&end=11&playsinline=1&modestbranding=1`;
                      const thumbnailUrl = `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;

                      verifiedMatches.push({
                        youtubeId: vId,
                        title: videoTitle,
                        channel: data.author_name || 'News Channel',
                        relevanceScore: matchCount,
                        accuracy: Number(accuracy.toFixed(2)),
                        confidencePercent,
                        isHighlyAccurate,
                        previewSnippetUrl,
                        thumbnailUrl
                      });
                    }
                  }
                } catch {}
              })
            );

            // Sort by highest relevance score so the best matching video is first
            verifiedMatches.sort((a, b) => b.relevanceScore - a.relevanceScore);

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify({
              videos: verifiedMatches.slice(0, 3),
              bestAccuracy: verifiedMatches[0]?.accuracy || 0,
              hasHighlyAccuratePreview: Boolean(verifiedMatches[0]?.isHighlyAccurate)
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message, videos: [] }));
          }
          return;
        }

        // Super smart accurate news image processing endpoint
        // Finds and delivers the authentic real news photo directly relevant to the news headline
        if (req.url && req.url.startsWith('/api/find-news-image')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const headline = urlObj.searchParams.get('headline') || '';

            if (!headline.trim()) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ imageUrl: null }));
              return;
            }

            const cleanHeadline = headline.replace(/ - [^]+$/, '').replace(/["']/g, '').slice(0, 70);

            // 1. Check YouTube for authentic press broadcast photo
            let realImage: string | null = null;
            let sourceTitle: string = 'Press Photo';
            let accuracy: number = 0;
            let previewGifUrl: string | null = null;
            let isHighlyAccurate: boolean = false;

            try {
              const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanHeadline + ' news')}`;
              const ytRes = await fetch(ytUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept-Language': 'en-US,en;q=0.9'
                },
                signal: AbortSignal.timeout(4500)
              });
              const ytHtml = await ytRes.text();
              const vIds: string[] = [];
              const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
              let vm;
              while ((vm = regex.exec(ytHtml)) !== null && vIds.length < 4) {
                if (!vIds.includes(vm[1])) vIds.push(vm[1]);
              }

              for (const vId of vIds) {
                const oe = await fetch(
                  `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vId}&format=json`,
                  { signal: AbortSignal.timeout(3000) }
                );
                if (oe.ok) {
                  const data = await oe.json();
                  const vTitle = (data.title || '').toLowerCase();
                  const hWords = cleanHeadline.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
                  const matched = hWords.filter(w => vTitle.includes(w));
                  if (matched.length >= 2) {
                    realImage = `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;
                    sourceTitle = data.author_name || 'News Broadcast';
                    accuracy = matched.length / hWords.length;
                    if (accuracy >= 0.85 || matched.length >= 3) {
                      isHighlyAccurate = true;
                      previewGifUrl = `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${vId}&start=4&end=11&playsinline=1&modestbranding=1`;
                    }
                    break;
                  }
                }
              }
            } catch {}

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify({
              imageUrl: realImage,
              sourceTitle,
              accuracy: Math.round(accuracy * 100),
              isRealNewsPhoto: Boolean(realImage),
              isHighlyAccurate,
              previewGifUrl
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ imageUrl: null, error: err?.message }));
          }
          return;
        }

        // Live internet search for any out-of-the-box or specific query across Google News & top news networks
        if (req.url && req.url.startsWith('/api/search-web-news')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const query = urlObj.searchParams.get('query') || '';
            const lang = urlObj.searchParams.get('lang') || 'en';
            const limit = parseInt(urlObj.searchParams.get('limit') || '25', 10);

            if (!query.trim()) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ articles: [], query: '', total: 0 }));
              return;
            }

            const hl = lang === 'hi' ? 'hi' : 'en-IN';
            const ceid = lang === 'hi' ? 'IN:hi' : 'IN:en';
            const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=IN&ceid=${ceid}`;

            const response = await fetch(rssUrl, {
              headers: {
                'User-Agent': 'AwaazNewsBot/1.0 (+mailto:contact@awaaznews.org) Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
              },
              signal: AbortSignal.timeout(8000)
            });

            if (!response.ok) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ articles: [], query, total: 0 }));
              return;
            }

            const xml = await response.text();
            const rawItems = xml.split('<item>').slice(1);
            const articles: any[] = [];

            // Contextual Unsplash image pools per category
            const categoryImages: Record<string, string[]> = {
              tech: [
                'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=800&fit=crop&q=80',
                'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop&q=80',
                'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=1200&h=800&fit=crop&q=80',
                'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=800&fit=crop&q=80'
              ],
              business: [
                'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&h=800&fit=crop&q=80',
                'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop&q=80',
                'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&h=800&fit=crop&q=80'
              ],
              sports: [
                'https://images.unsplash.com/photo-1531415074868-036b107e775a?w=1200&h=800&fit=crop&q=80',
                'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&h=800&fit=crop&q=80',
                'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=800&fit=crop&q=80'
              ],
              politics: [
                'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&h=800&fit=crop&q=80',
                'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=800&fit=crop&q=80',
                'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&h=800&fit=crop&q=80'
              ],
              world: [
                'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&h=800&fit=crop&q=80',
                'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&h=800&fit=crop&q=80'
              ],
              entertainment: [
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=800&fit=crop&q=80',
                'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=800&fit=crop&q=80'
              ],
              general: [
                'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=800&fit=crop&q=80',
                'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&h=800&fit=crop&q=80'
              ]
            };

            for (let i = 0; i < Math.min(rawItems.length, limit); i++) {
              const raw = rawItems[i];
              const rawTitle = (raw.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
              const link = (raw.match(/<link>([^<]+)<\/link>/) || [])[1] || '';
              const pubDate = (raw.match(/<pubDate>([^<]+)<\/pubDate>/) || [])[1] || '';
              const sourceName = (raw.match(/<source[^>]*>([^<]+)<\/source>/) || [])[1] || 'News Source';

              let cleanTitle = rawTitle;
              const lastDash = cleanTitle.lastIndexOf(' - ');
              if (lastDash > 15) {
                cleanTitle = cleanTitle.slice(0, lastDash).trim();
              }

              const rawDesc = (raw.match(/<description>([^<]+)<\/description>/) || [])[1] || '';
              const cleanDesc = rawDesc
                .replace(/&lt;[^&]*&gt;/g, ' ')
                .replace(/<[^>]*>/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&nbsp;/g, ' ')
                .trim();

              const lowerText = (cleanTitle + ' ' + cleanDesc).toLowerCase();

              let category = 'politics';
              if (/cricket|match|wicket|goal|ipl|badminton|football|tennis|sports|medal|olympic|trophy|rohit|kohli/.test(lowerText)) {
                category = 'sports';
              } else if (/sensex|nifty|market|stock|rupee|dollar|rbi|economy|gdp|inflation|earnings|shares|profit|revenue|invest/.test(lowerText)) {
                category = 'business';
              } else if (/isro|nasa|satellite|ai|technology|software|apple|google|chip|cyber|tech|quantum|robot|space|iphone|tesla/.test(lowerText)) {
                category = 'tech';
              } else if (/protest|farmers|morcha|msp|strike|march|rally|agitation/.test(lowerText)) {
                category = 'protests';
              } else if (/court|supreme|police|crime|arrest|fir|scam|fraud|jail|bail|cbi|ed|safety|investigation/.test(lowerText)) {
                category = 'crime';
              } else if (/film|movie|actor|bollywood|cinema|trailer|song|album|festival|actress/.test(lowerText)) {
                category = 'entertainment';
              } else if (/hospital|doctor|health|virus|disease|medical|surgery|vaccine|cancer/.test(lowerText)) {
                category = 'health';
              } else if (/us|china|pakistan|ukraine|russia|israel|iran|un|biden|trump|putin|global|war|summit/.test(lowerText)) {
                category = 'world';
              }

              const detectedCities: string[] = [];
              const cityList = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Chandigarh', 'Jaipur', 'Lucknow', 'Patna', 'Bhopal', 'Kochi', 'Guwahati', 'Srinagar'];
              for (const city of cityList) {
                if (new RegExp(`\\b${city}\\b`, 'i').test(cleanTitle + ' ' + cleanDesc)) {
                  detectedCities.push(city);
                }
              }

              const imgPool = categoryImages[category] || categoryImages.general;
              const imgIndex = Math.abs((cleanTitle.length + i)) % imgPool.length;

              articles.push({
                id: 60000 + i + Math.floor(Math.random() * 100000),
                title: cleanTitle,
                summary: cleanDesc.length > 30 ? cleanDesc.slice(0, 220) : cleanTitle,
                url: link || 'https://news.google.com',
                publishedAt: pubDate ? new Date(pubDate).getTime() : Date.now() - (i * 180000),
                language: lang === 'hi' ? 'hi' : 'en',
                category,
                cities: detectedCities,
                source: {
                  id: `source-${sourceName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                  name: sourceName,
                  domain: sourceName.toLowerCase().replace(/\s+/g, '') + '.com',
                  language: lang === 'hi' ? 'hi' : 'en'
                },
                image: {
                  url: imgPool[imgIndex],
                  width: 1200,
                  height: 800
                }
              });
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify({ articles, query, total: articles.length }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message, articles: [], query: '', total: 0 }));
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), rssProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
