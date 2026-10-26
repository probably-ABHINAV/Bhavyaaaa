# BHAVYAA · The Birthday Edition

A standalone Netflix-inspired birthday experience for 27 October 2026, independent of the Opscord application.

## Preview

Run `npm run dev` here and open http://127.0.0.1:4317. No dependencies or build step are needed. `dist` is the deployable site; `npm run check` checks all JavaScript syntax.

## Experience

- Personal BHAVYAA identity, cinematic rotating portrait hero, and selectable portrait thumbnails.
- 35 original-resolution still images from eight accessible Instagram photo posts, including carousel slides; six curated portrait collections and a complete photo gallery.
- An original 60-second birthday film with eight scenes, chapter controls, pause, replay, and Khat by Navjot Ahuja in Spotify's official player. The opening tray offers Play Khat + film or silent viewing; closing the film stops its player. Spotify may require native Play/sign-in or provide a preview.
- Four personal birthday wishes, an ivory-paper letter reveal, and browser-local saved wishes.
- An interactive candle and a birthday wish ticket with eight rotating messages. Make a wish, reveal a message, ask for another, or relight the candle. Each message appears once before the set repeats. No microphone or sound is involved.
- Two photo games: six-pair memory match and a 3×3 portrait puzzle, with moves, hints, resets, and completion messages.
- A 12-song Hindi library with an official Spotify player, three mood filters, song/artist search, previous/next selection, and a “Surprise me” shuffle button. The browser remembers the selected song. Selecting a track loads its player; playback starts only when the listener presses play. No music is downloaded or autoplayed.
- Countdown to midnight on 27 October 2026 in India (+05:30), then a birthday greeting and a new-chapter message.
- A personalized “Today is all yours, Bhavyaa” greeting and letter teaser during the configured birthday day, using the same India-time window as the countdown.
- Responsive layouts, readable mobile captions, keyboard controls, native dialogs, reduced-motion support, and self-hosted fonts. Navigation follows the page order and highlights the current section.

Mobile layouts were browser-checked at 320, 360, 390, 430, 600, 768, and 844 pixels, plus a 1280-pixel desktop layout, with no page-wide horizontal overflow. Phones use two-row navigation and larger touch controls; the memory game fits landscape screens, and the letter's close button stays visible while scrolling.

## Personalize

Edit `dist/content.js` for the name, date, wishes, and letter. Edit `dist/photos.js` for images, collection membership, and hero portraits. All images are stored locally. `dist/music-data.js` contains the 12 songs, artist credits, mood tags, and official Spotify links; `dist/music.js` defines library search and selection. `dist/cinema.js` defines film scenes; `dist/edition.css` refines the visual design; `dist/wish.js` and `dist/wish.css` define the candle and eight-message wish ticket. `dist/premium.js` handles the portrait hero, active navigation, and birthday-day greeting.

This import includes still-image posts accessed through the supplied profile. It does not include reels, stories, or highlights. Rights remain with the original creators; see `asset-sources.md`.

For Vercel deployment, follow `DEPLOY-VERCEL.md`. The supplied `vercel.json` publishes the `dist` directory. The existing ChatGPT Sites preview is owner-private; a separate Vercel deployment has its own access settings.
