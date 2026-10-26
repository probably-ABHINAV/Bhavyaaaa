# Publish BHAVYAA on Vercel

The ZIP contains the complete editable website and all 35 photos, fonts, games, and local artwork. It uses plain HTML, CSS, and JavaScript. No database, API keys, or paid dependencies are required. Spotify streams through its official embedded player and needs an internet connection.

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
- `dist/music-data.js`: the three Spotify tracks and official embed links.
- `dist/cinema.js`: the 60-second photo film.
- `dist/arcade.js` and `dist/arcade.css`: memory game and portrait puzzle.
- `dist/wish.js` and `dist/wish.css`: interactive birthday candle.
- `dist/edition.css`: final brand and layout refinements.

The date is **27 October 2026, midnight in India**. The countdown changes automatically into a birthday greeting on that date and a new-chapter message afterwards. Spotify controls playback availability; a listener may get a preview or need to sign in for more playback.

The Vercel website is independent of the private ChatGPT Sites preview. Configure access in your Vercel project if you want a restricted audience. Your photos and letter are part of the deployed website.

Official references: [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json), [Vercel CLI](https://vercel.com/docs/cli), [Spotify embeds](https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed).
