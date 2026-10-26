# BHAVYAA · The Birthday Edition

A standalone Netflix-inspired birthday experience for 27 October 2026, independent of the Opscord application.

## Preview

Run `npm run dev` here and open http://127.0.0.1:4317. No dependencies or build step are needed. `dist` is the deployable site; `npm run check` checks all JavaScript syntax.

## Experience

- Personal BHAVYAA identity, cinematic rotating portrait hero, and selectable portrait thumbnails.
- 35 original-resolution still images from eight accessible Instagram photo posts, including carousel slides; six curated portrait collections and a complete photo gallery.
- An original 60-second birthday film with eight scenes, chapter controls, pause, replay, and optional synthesized ambient music. Sound is off until selected.
- Four personal birthday wishes, an ivory-paper letter reveal, and browser-local saved wishes.
- An interactive candle: make a wish, extinguish the flame, reveal the greeting, and relight it. No microphone or sound is involved.
- Two photo games: six-pair memory match and a 3×3 portrait puzzle, with moves, hints, resets, and completion messages.
- Three soft Hindi songs in an official Spotify player: Iktara, Kho Gaye Hum Kahan, and Sham. No music is downloaded or autoplayed.
- Countdown to midnight on 27 October 2026 in India (+05:30), then a birthday greeting and a new-chapter message.
- Responsive layouts, keyboard controls, native dialogs, reduced-motion support, and self-hosted fonts.

Mobile layouts were browser-checked at 320, 360, 390, 430, 600, 768, and 844 pixels, plus a 1280-pixel desktop layout, with no page-wide horizontal overflow. Phones use two-row navigation and larger touch controls; the memory game fits landscape screens, and the letter's close button stays visible while scrolling.

## Personalize

Edit `dist/content.js` for the name, date, wishes, and letter. Edit `dist/photos.js` for images, collection membership, and hero portraits. All images are stored locally. `dist/cinema.js` defines film scenes; `dist/edition.css` refines the visual design; `dist/wish.js` and `dist/wish.css` define the candle interaction.

This import includes still-image posts accessed through the supplied profile. It does not include reels, stories, or highlights. Rights remain with the original creators; see `asset-sources.md`.

For Vercel deployment, follow `DEPLOY-VERCEL.md`. The supplied `vercel.json` publishes the `dist` directory. The existing ChatGPT Sites preview is owner-private; a separate Vercel deployment has its own access settings.
