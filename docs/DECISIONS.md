# Architectural & Legal Decisions

1. **Strict Non-Commercial & Educational Scope (Fair Dealing):**
   - Summary length is strictly clamped to ≤ 400 characters.
   - Publisher source name and direct canonical links are prominently rendered on every card and in the Story Player.
   - No article body is scraped, stored, or indexed.
   - Images are hot-linked directly from publisher CDN endpoints without local re-hosting.
   - In accordance with publisher RSS terms (e.g., The Hindu, BBC, Times Group), commercial advertising and sponsorship monetization are disabled.

2. **Frontend Aesthetic Philosophy (Claude.ai Simplicity):**
   - Deep charcoal/slate background (`#0E1116`) paired with soft ivory text (`#E8ECF1`), muted slate (`#9AA6B2`), and warm terracotta accent (`#FF6B35`).
   - Zero visual clutter, distraction-free typography, and responsive breathing room.
   - Fluid shared-layout micro-interactions powered by Motion (`framer-motion`).

3. **Devanagari Tokenization:**
   - Standard regex word boundaries (`\b`) do not reliably segment Devanagari script. A custom Unicode-aware tokenizer splitting on punctuation, whitespace, and danda (`।`) characters is used for exact Hindi keyword matching.

4. **Speech Synthesis Resilience:**
   - Uses Web Speech API with sentence-by-sentence queueing to avoid the Chrome 15-second speech silence bug.
   - Implements graceful fallback with a gentle user banner when no Hindi voice is installed on the user device.
