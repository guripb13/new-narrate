# Manual Test Matrix & Acceptance Check

| Test ID | Scenario | Expected Behavior | Status |
|---|---|---|---|
| MT-01 | First-time visitor onboarding | 5-step wizard appears, gathers Country, Language, Categories, City, Query; saves to localStorage. | PASS |
| MT-02 | Return visitor | Skips wizard, displays personalized "For You" masonry news feed. | PASS |
| MT-03 | Language switch | Toggling EN / HI updates all UI strings and filters articles to matching language. | PASS |
| MT-04 | Responsive Masonry | 4 columns on large desktop, 3 columns on laptop (1280px), 2 columns on tablet (1024px), 1 column on mobile (<640px). | PASS |
| MT-05 | Story Player expansion | Clicking card smoothly animates card to center (desktop) or bottom sheet (mobile). | PASS |
| MT-06 | Auto-narration | Narration begins within 1.5s of modal open with rotating intro and correct pronunciation expansions. | PASS |
| MT-07 | Synced captions | Live captions highlight current spoken sentence in real-time. | PASS |
| MT-08 | Playback controls | Play/pause, stop, prev/next, and speed change (0.75x to 1.5x) work seamlessly. | PASS |
| MT-09 | Play briefing mode | Narrates top 10 articles sequentially with 600ms pause between stories. | PASS |
| MT-10 | Search & Filtering | Category chips filter immediately; debounced search queries filter both English and Hindi text. | PASS |
| MT-11 | Query relaxation | Over-constrained search cascades (drops city -> drops query -> drops category) with "Showing broader results" note. | PASS |
| MT-12 | Keyboard navigation | Esc closes player, Space toggles play/pause, Left/Right arrows navigate stories. | PASS |
| MT-13 | Attribution & ethics | Every card and player displays publisher name and "Read full story ↗" canonical link. | PASS |
| MT-14 | Image failure resilience | Broken image swaps to deterministic category gradient text card without layout shift. | PASS |
