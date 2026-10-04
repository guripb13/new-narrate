# Open Questions & Safe Defaults

1. **Q: How to handle external image hot-linking failures or strict CORS/hotlink protection?**
   - **Safe Default:** Cards attach an `onError` listener to the image element. If the remote publisher image fails to load or blocks embedding, the card automatically morphs into a Text Card with a deterministic category-derived gradient background.

2. **Q: Behavior when a user device has no Hindi TTS voice installed?**
   - **Safe Default:** The Story Player displays an elegant, non-blocking banner: *"This device does not have a Hindi voice installed. You can install one in system speech settings, or read the captions below."* Synced live captions continue to operate normally.

3. **Q: Related YouTube videos when YOUTUBE_API_KEY is unset?**
   - **Safe Default:** When API key is not present, the Video tab is gracefully omitted, leaving the high-resolution Ken Burns image pane intact.
