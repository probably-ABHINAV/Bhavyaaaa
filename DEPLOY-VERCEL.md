# Publish BHAVYAA on Vercel

The ZIP contains the complete editable website and all 35 photos, fonts, games, and local artwork. It uses plain HTML, CSS, and JavaScript. No database, API keys, or paid dependencies are required. The 12-song library streams through Spotify's official embedded player and needs an internet connection.

## Easiest route: GitHub and Vercel

1. Extract the ZIP. Open the `bhavyaa-birthday` folder.
2. Create a GitHub repository and upload the **contents** of this folder, including `dist`, `package.json`, and `vercel.json`.
3. In Vercel, choose **Add New → Project**, then import that repository.
4. The supplied `vercel.json` selects **Other**, runs `npm run check`, and serves **dist**. If the dashboard asks, use those same settings. Leave Root Directory at the folder containing `package.json`.
5. Click **Deploy**. Vercel will provide your website URL.

## Terminal alternative

With Node.js installed, open a terminal in the extracted `bhavyaa-birthday` folder:

```sh
npx vercel
```

Sign in when prompted and follow the project setup. When ready to publish the production version:

```sh
npx vercel --prod
```

The commands above deploy to your own Vercel account. No credentials or pre-linked Vercel project are included.

## Preview and edit

```sh
npm run dev
```

Open http://127.0.0.1:4317. Stop the server with Ctrl+C.

- `dist/content.js`: name, birthday date, four wishes, personal letter.
- `dist/photos.js`: gallery images and collections.
- `dist/music-data.js`: the 12 Spotify tracks, artist credits, mood tags, and official embed links.
- `dist/music.js` and `dist/music.css`: mood filters, song/artist search, previous/next selection, “Surprise me” shuffle, and browser-local remembered selection.
- `dist/cinema.js`: the 60-second photo film.
- `dist/arcade.js` and `dist/arcade.css`: memory game and portrait puzzle.
- `dist/wish.js` and `dist/wish.css`: interactive birthday candle and eight rotating birthday-ticket messages.
- `dist/premium.js`: portrait selection, active section navigation, and birthday-day hero/letter greetings.
- `dist/edition.css`: final brand and layout refinements.

The date is **27 October 2026, midnight in India**. The countdown changes automatically into a birthday greeting on that date and a new-chapter message afterwards. The hero and letter teaser also personalize their text during that same 24-hour window, using the offset in `dist/content.js` rather than the visitor's local timezone.

The song library includes Warm nostalgia, Indie evenings, and Open skies mood filters. Previous/next and shuffle select from the current search and mood results; selection loads a track without autoplay. The last selected song is remembered only in the current browser. Spotify controls playback availability; a listener may get a preview or need to sign in for more playback.

The wish ticket shows one of eight messages when the candle is extinguished. “One more little wish” draws another message without repeating the current set; relighting hides the ticket. The mobile layout keeps navigation, captions, and touch controls readable, and highlights the section currently being viewed.

The Vercel website is independent of the private ChatGPT Sites preview. Configure access in your Vercel project if you want a restricted audience. Your photos and letter are part of the deployed website.

Official references: [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json), [Vercel CLI](https://vercel.com/docs/cli), [Spotify embeds](https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed).
