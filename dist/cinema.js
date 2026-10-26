/* A sixty-second photo premiere, with Khat in Spotify's official player. */
(() => {
  'use strict';
  const durations = [5, 8, 8, 8, 8, 8, 8, 7];
  const starts = durations.map((_, index) => durations.slice(0, index).reduce((sum, n) => sum + n, 0));
  const total = durations.reduce((sum, n) => sum + n, 0);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const soundtrack = {
    title: 'Khat', artist: 'Navjot Ahuja',
    url: 'https://open.spotify.com/track/3gixnmepHSsyAuho34rprN?utm_source=openai&utm_medium=chatgpt&go=1&nap_web=1&request_id=44c3cbfe-54b4-42fe-bbbc-ebf60ded0b2d'
  };
  const icons = {
    play: '<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    next: '<path d="m9 5 7 7-7 7"/>',
    previous: '<path d="m15 5-7 7 7 7"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    sound: '<path d="m11 5-5 4H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
    muted: '<path d="m11 5-5 4H3v6h3l5 4ZM16 9l6 6m0-6-6 6"/>',
    replay: '<path d="M4 10a8 8 0 1 1 1 8M4 3v7h7"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  let dialog, stage, playback, sound, clock, segments, sceneLabel, ending, announcer;
  let soundtrackTray, soundtrackPlayer, soundtrackStatus, soundtrackStart;
  let frames = [], sceneIndex = -1, elapsed = 0, lastTick = 0, raf = 0;
  let running = false, active = false, previousFocus;
  let spotifyApi, spotifyPromise, spotifyController, soundtrackSession = 0;
  let soundtrackReady = false, soundtrackPlaying = false, soundtrackRequested = false;

  function loadSpotifyApi() {
    if (spotifyApi) return Promise.resolve(spotifyApi);
    if (spotifyPromise) return spotifyPromise;
    spotifyPromise = new Promise((resolve, reject) => {
      const previousReady = window.onSpotifyIframeApiReady;
      const script = document.createElement('script');
      const timeout = window.setTimeout(() => reject(new Error('Spotify player did not load.')), 15000);
      window.onSpotifyIframeApiReady = api => {
        spotifyApi = api;
        window.clearTimeout(timeout);
        resolve(api);
        if (typeof previousReady === 'function') previousReady(api);
      };
      script.src = 'https://open.spotify.com/embed/iframe-api/v1';
      script.async = true;
      script.addEventListener('error', () => {
        window.clearTimeout(timeout);
        reject(new Error('Spotify player is unavailable.'));
      }, { once: true });
      document.head.append(script);
    });
    return spotifyPromise;
  }

  function buildDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'cinema-dialog';
    dialog.setAttribute('aria-label', 'A birthday premiere for Bhavyaa');
    dialog.innerHTML = `
      <div class="cinema-shell">
        <header class="cinema-topbar"><span class="cinema-brand"><span>BHAVYAA</span> ORIGINAL</span><span class="cinema-topline">A LITTLE FILM, JUST FOR YOU</span><button type="button" class="cinema-icon-button cinema-close" aria-label="Close birthday film">${icon('close')}</button></header>
        <div class="cinema-stage"></div><div class="cinema-grain" aria-hidden="true"></div>
        <div class="cinema-announcer" role="status" aria-live="polite"></div>
        <section class="cinema-soundtrack-tray" id="cinema-soundtrack" aria-labelledby="cinema-soundtrack-title" hidden>
          <div class="cinema-soundtrack-heading"><p>THE SOUNDTRACK</p><button type="button" class="cinema-icon-button cinema-soundtrack-dismiss" aria-label="Hide soundtrack player">${icon('close')}</button></div>
          <h2 id="cinema-soundtrack-title" tabindex="-1">${soundtrack.title}<em>by ${soundtrack.artist}</em></h2>
          <p class="cinema-soundtrack-intro">A song for your birthday film.</p>
          <div class="cinema-soundtrack-player"></div>
          <p class="cinema-soundtrack-status" role="status" aria-live="polite">Loading the Spotify player…</p>
          <button type="button" class="cinema-soundtrack-start" disabled>${icon('play')}<span>Play Khat + film</span></button>
          <button type="button" class="cinema-soundtrack-silent">Watch without music</button>
          <p class="cinema-soundtrack-note">If the song doesn’t start, tap Khat below and use Spotify’s play button. Spotify may offer a preview or ask you to sign in.</p>
          <a class="cinema-soundtrack-link" href="${escape(soundtrack.url)}" target="_blank" rel="noopener noreferrer">Open Khat on Spotify <span aria-hidden="true">↗</span></a>
        </section>
        <footer class="cinema-controls">
          <div class="cinema-timeline" aria-label="Film chapters">${durations.map((duration, index) => `<button type="button" class="cinema-segment" style="--segment-weight:${duration}" data-cinema-scene="${index}" aria-label="Jump to chapter ${index + 1}"><span></span></button>`).join('')}</div>
          <div class="cinema-control-row"><div class="cinema-playback-group"><button type="button" class="cinema-icon-button cinema-playback" aria-label="Pause film">${icon('pause')}</button><button type="button" class="cinema-icon-button cinema-previous" aria-label="Previous chapter">${icon('previous')}</button><button type="button" class="cinema-icon-button cinema-next" aria-label="Next chapter">${icon('next')}</button><span class="cinema-clock">0:00 <span>/ 1:00</span></span></div><span class="cinema-scene-label">THE OPENING</span><button type="button" class="cinema-sound" aria-controls="cinema-soundtrack" aria-expanded="false" aria-label="Open Khat soundtrack by Navjot Ahuja">${icon('sound')}<span>Khat</span></button></div>
        </footer>
      </div>`;
    document.body.append(dialog);
    stage = dialog.querySelector('.cinema-stage');
    playback = dialog.querySelector('.cinema-playback'); sound = dialog.querySelector('.cinema-sound');
    clock = dialog.querySelector('.cinema-clock'); sceneLabel = dialog.querySelector('.cinema-scene-label');
    announcer = dialog.querySelector('.cinema-announcer');
    soundtrackTray = dialog.querySelector('.cinema-soundtrack-tray');
    soundtrackPlayer = dialog.querySelector('.cinema-soundtrack-player');
    soundtrackStatus = dialog.querySelector('.cinema-soundtrack-status');
    soundtrackStart = dialog.querySelector('.cinema-soundtrack-start');
    segments = Array.from(dialog.querySelectorAll('.cinema-segment'));
    dialog.querySelector('.cinema-close').addEventListener('click', close);
    playback.addEventListener('click', togglePlayback);
    dialog.querySelector('.cinema-previous').addEventListener('click', () => jump(sceneIndex - 1));
    dialog.querySelector('.cinema-next').addEventListener('click', () => jump(sceneIndex + 1));
    segments.forEach((segment, index) => segment.addEventListener('click', () => jump(index)));
    sound.addEventListener('click', () => setSoundtrackTray(soundtrackTray.hidden));
    dialog.querySelector('.cinema-soundtrack-dismiss').addEventListener('click', () => setSoundtrackTray(false));
    soundtrackStart.addEventListener('click', () => startFromSoundtrack(true));
    dialog.querySelector('.cinema-soundtrack-silent').addEventListener('click', () => startFromSoundtrack(false));
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', cleanup);
    dialog.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (soundtrackTray.hidden && event.key === 'ArrowRight') { event.preventDefault(); jump(sceneIndex + 1); }
      if (soundtrackTray.hidden && event.key === 'ArrowLeft') { event.preventDefault(); jump(sceneIndex - 1); }
      if (event.key === ' ' && event.target === dialog) { event.preventDefault(); togglePlayback(); }
      if (event.key === 'Escape' && typeof dialog.showModal !== 'function') { event.preventDefault(); close(); }
      if (event.key === 'Tab' && typeof dialog.showModal !== 'function') {
        const focusable = Array.from(dialog.querySelectorAll('button:not(:disabled), a[href], iframe')).filter(node => node.getClientRects().length && !node.closest('[inert]'));
        if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); }
        if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0]?.focus(); }
      }
    });
  }

  function makeScenes() {
    const data = window.BIRTHDAY || {};
    const photos = Array.isArray(data.photos) ? data.photos : [];
    const collections = Array.isArray(data.collections) ? data.collections : [];
    const first = photos[0] || { image: 'assets/hero.jpg', title: 'A birthday moment' };
    function photo(index) {
      const item = photos[index] || first;
      return { image: item.image || item.src || item.url || 'assets/hero.jpg', title: item.title || 'A moment in the birthday film', position: item.position || '50% 40%' };
    }
    function picked(collectionIndex, itemIndex, fallback) {
      const collection = collections[collectionIndex];
      const index = collection?.indices?.[itemIndex];
      return photo(Number.isInteger(index) ? index : fallback);
    }
    const name = escape(data.name || 'Bhavyaa');
    const scenes = [
      { kind: 'opening', label: 'THE OPENING', kicker: '27 OCTOBER · A BIRTHDAY ORIGINAL', title: 'Some people make ordinary moments feel like <em>cinema.</em>', copy: 'This little film is for you.', images: [photo(0)] },
      { kind: 'portrait', label: '01 / THE LITTLE THINGS', kicker: 'FOR THE LITTLE THINGS', title: 'More reasons<br>to <em>smile.</em>', copy: 'The unplanned laughs. The favourite songs.<br>The small things that turn into a good day.', images: [picked(0, 1, 1)] },
      { kind: 'diptych', label: '02 / YOUR OWN KIND OF HAPPY', kicker: 'YOUR OWN KIND OF HAPPY', title: 'A little more <em>you.</em>', copy: 'May you always have room for the things that make you feel most like yourself.', images: [picked(1, 0, 24), picked(1, 1, 21)] },
      { kind: 'portrait cinema-reverse', label: '03 / SO MUCH AHEAD', kicker: 'SO MUCH STILL TO COME', title: 'New places.<br>New <em>possibilities.</em>', copy: 'A new year of finding your way.<br>And good things you haven’t even imagined yet.', images: [picked(2, 0, 13)] },
      { kind: 'triptych', label: '04 / A LITTLE ADVENTURE', kicker: 'A LITTLE ADVENTURE', title: 'Say yes to <em>wonder.</em>', copy: 'Here’s to days that surprise you in the best possible way.', images: [picked(3, 0, 8), picked(3, 1, 11), picked(3, 2, 12)] },
      { kind: 'portrait', label: '05 / ROOM TO BLOOM', kicker: 'AT YOUR OWN PACE', title: 'Keep becoming.<br>Keep <em>blooming.</em>', copy: 'May this next chapter give you room to grow,<br>and plenty of moments to simply be.', images: [picked(4, 0, 30)] },
      { kind: 'diptych cinema-night', label: '06 / ALL THE GOOD THINGS', kicker: 'A WISH FOR THE YEAR AHEAD', title: 'A softer life.<br>A brighter <em>year.</em>', copy: 'Good company. Peace of mind.<br>And so many reasons to look forward.', images: [picked(5, 0, 16), picked(5, 1, 24)] },
      { kind: 'closing', label: 'THE NEXT CHAPTER', kicker: '27 OCTOBER · THIS DAY IS YOURS', title: `Happy birthday,<br><em>${name}.</em>`, copy: 'Here’s to everything still to come.', images: [photo(0)] }
    ];
    const photoMarkup = (item, index) => `<div class="cinema-photo cinema-photo-${index}"><img src="${escape(item.image)}" alt="${escape(item.title)}" style="object-position:${escape(item.position)}" decoding="async" draggable="false"></div>`;
    stage.innerHTML = scenes.map((scene, index) => `<section class="cinema-scene cinema-${scene.kind}" data-scene="${index}" aria-hidden="true" style="--scene-duration:${durations[index]}s">
      <div class="cinema-backdrop" aria-hidden="true"><img src="${escape(scene.images[0].image)}" alt="" decoding="async"></div>
      <div class="cinema-picture-group">${scene.images.map(photoMarkup).join('')}</div>
      <div class="cinema-words"><p class="cinema-kicker">${scene.kicker}</p><h2>${scene.title}</h2><p class="cinema-copy">${scene.copy}</p>${index === 7 ? `<div class="cinema-ending-actions"><button type="button" class="cinema-letter">There’s a letter for you <span aria-hidden="true">↗</span></button><button type="button" class="cinema-replay">${icon('replay')} Replay film</button></div>` : ''}</div>
      <span class="cinema-scene-number" aria-hidden="true">${String(index + 1).padStart(2, '0')} <span>/ 08</span></span>
    </section>`).join('');
    frames = Array.from(stage.querySelectorAll('.cinema-scene'));
    frames.forEach((frame, index) => frame.dataset.label = scenes[index].label);
    ending = stage.querySelector('.cinema-ending-actions');
    ending.hidden = true;
    stage.querySelector('.cinema-replay').addEventListener('click', () => { jump(0); setPlaying(true); playback.focus({ preventScroll: true }); });
    stage.querySelector('.cinema-letter').addEventListener('click', () => {
      close();
      window.setTimeout(() => document.querySelector('[data-open-letter]')?.click(), 0);
    });
  }

  function showScene(index) {
    if (index === sceneIndex) return;
    const previous = frames[sceneIndex];
    if (previous) { previous.classList.remove('cinema-current'); previous.setAttribute('aria-hidden', 'true'); previous.inert = true; }
    sceneIndex = index;
    frames[index].classList.add('cinema-current'); frames[index].setAttribute('aria-hidden', 'false'); frames[index].inert = false;
    sceneLabel.textContent = frames[index].dataset.label;
    announcer.textContent = frames[index].querySelector('h2').textContent;
    dialog.querySelector('.cinema-previous').disabled = index === 0;
    dialog.querySelector('.cinema-next').disabled = index === frames.length - 1;
    segments.forEach((segment, position) => {
      if (position === index) segment.setAttribute('aria-current', 'step'); else segment.removeAttribute('aria-current');
    });
  }
  function draw() {
    const index = Math.min(starts.filter(start => elapsed >= start).length - 1, 7);
    showScene(Math.max(index, 0));
    segments.forEach((segment, position) => segment.style.setProperty('--progress', Math.min(1, Math.max(0, (elapsed - starts[position]) / durations[position]))));
    const seconds = Math.min(total, Math.floor(elapsed));
    clock.innerHTML = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} <span>/ 1:00</span>`;
  }
  function tick(now) {
    if (!active || !running) return;
    if (lastTick) elapsed = Math.min(total, elapsed + (now - lastTick) / 1000);
    lastTick = now; draw();
    if (elapsed >= total) {
      setPlaying(false); ending.hidden = false; dialog.classList.add('cinema-ended');
      announcer.textContent = 'Happy birthday, Bhavyaa. The film has ended. Read your letter or replay the film.';
      return;
    }
    raf = requestAnimationFrame(tick);
  }
  function setPlaying(value) {
    running = value; lastTick = 0; cancelAnimationFrame(raf);
    dialog.classList.toggle('cinema-paused', !value);
    playback.innerHTML = icon(value ? 'pause' : elapsed >= total ? 'replay' : 'play');
    playback.setAttribute('aria-label', value ? 'Pause film' : elapsed >= total ? 'Replay film' : 'Resume film');
    if (!value) pauseSoundtrack();
    else if (soundtrackRequested && !soundtrackPlaying) commandSoundtrack('resume');
    if (value && active) raf = requestAnimationFrame(tick);
  }
  function togglePlayback() { if (elapsed >= total) { jump(0); setPlaying(true); } else setPlaying(!running); }
  function jump(index) {
    if (!active) return;
    elapsed = starts[Math.max(0, Math.min(7, index))]; lastTick = 0;
    ending.hidden = true; dialog.classList.remove('cinema-ended'); draw();
    if (!running) { playback.innerHTML = icon('play'); playback.setAttribute('aria-label', 'Resume film'); }
  }
  function commandSoundtrack(method) {
    try { spotifyController?.[method](); } catch (_) { /* Native controls and Spotify link remain available. */ }
  }
  function pauseSoundtrack() {
    if (soundtrackRequested || soundtrackPlaying) commandSoundtrack('pause');
    soundtrackPlaying = false;
    sound?.classList.remove('is-playing');
    if (soundtrackReady) soundtrackStatus.textContent = 'Khat is paused. Press play when you are ready.';
  }
  function setSoundtrackTray(visible, focus = true) {
    if (visible) setPlaying(false);
    soundtrackTray.hidden = !visible;
    stage.inert = visible;
    dialog.querySelector('.cinema-controls').inert = visible;
    dialog.classList.toggle('cinema-soundtrack-open', visible);
    sound.setAttribute('aria-expanded', String(visible));
    if (!visible && !running) pauseSoundtrack();
    if (focus) (visible ? dialog.querySelector('#cinema-soundtrack-title') : playback).focus({ preventScroll: true });
  }
  function startFromSoundtrack(withMusic) {
    if (!active) return;
    if (elapsed >= total) jump(0);
    // Keep the play request in this click gesture; Spotify/browser policy can still require native Play.
    soundtrackRequested = false;
    setPlaying(true);
    if (withMusic && soundtrackReady) {
      soundtrackRequested = true;
      commandSoundtrack('play');
    } else pauseSoundtrack();
    setSoundtrackTray(false);
  }
  async function prepareSoundtrack() {
    const session = ++soundtrackSession;
    soundtrackReady = false; soundtrackPlaying = false; soundtrackRequested = false;
    soundtrackStart.disabled = true;
    soundtrackStatus.textContent = 'Loading the Spotify player…';
    soundtrackPlayer.replaceChildren();
    const mount = document.createElement('div');
    soundtrackPlayer.append(mount);
    try {
      const api = await loadSpotifyApi();
      if (!active || session !== soundtrackSession) return;
      api.createController(mount, { url: soundtrack.url, width: '100%', height: 152 }, controller => {
        if (!active || session !== soundtrackSession) { controller.destroy(); return; }
        spotifyController = controller;
        const current = () => active && session === soundtrackSession && spotifyController === controller;
        controller.addListener('ready', () => {
          if (!current()) return;
          soundtrackReady = true;
          soundtrackStart.disabled = false;
          soundtrackStatus.textContent = 'Your film is ready when you are.';
          const iframe = soundtrackPlayer.querySelector('iframe');
          if (iframe) iframe.title = 'Khat by Navjot Ahuja — official Spotify player';
        });
        controller.addListener('playback_started', () => {
          if (!current()) return;
          if (document.hidden || (!running && soundtrackTray.hidden)) { pauseSoundtrack(); return; }
          soundtrackRequested = true;
          soundtrackStatus.textContent = 'Khat is playing. Start the film whenever you’re ready.';
        });
        controller.addListener('playback_update', event => {
          if (!current() || typeof event.data?.isPaused !== 'boolean') return;
          const wasPlaying = soundtrackPlaying;
          soundtrackPlaying = !event.data.isPaused;
          if (soundtrackPlaying) {
            soundtrackRequested = true;
            if (document.hidden || (!running && soundtrackTray.hidden)) { pauseSoundtrack(); return; }
          } else if (wasPlaying && running) soundtrackRequested = false;
          sound.classList.toggle('is-playing', soundtrackPlaying);
        });
      });
    } catch (_) {
      if (!active || session !== soundtrackSession) return;
      soundtrackStatus.textContent = 'Spotify could not load here. Open the song on Spotify, or watch the film without music.';
    }
  }
  function stopSoundtrack() {
    soundtrackSession++;
    pauseSoundtrack();
    commandSoundtrack('destroy');
    spotifyController = null;
    soundtrackReady = false; soundtrackRequested = false;
    soundtrackPlayer?.replaceChildren();
  }
  function cleanup() {
    if (!active) return;
    active = false; running = false; cancelAnimationFrame(raf); stopSoundtrack();
    document.body.classList.remove('cinema-open');
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }
  function close() {
    if (!dialog || !active) return;
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    cleanup();
  }
  document.addEventListener('visibilitychange', () => {
    if (active && document.hidden) setPlaying(false);
  });
  window.openBirthdayPremiere = () => {
    if (active) return;
    buildDialog(); makeScenes();
    previousFocus = document.activeElement;
    elapsed = 0; sceneIndex = -1; active = true;
    document.dispatchEvent(new CustomEvent('birthday:film-open'));
    frames.forEach(frame => frame.inert = true);
    dialog.classList.toggle('cinema-reduced-motion', motion.matches);
    dialog.classList.remove('cinema-ended');
    document.body.classList.add('cinema-open');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    draw(); setPlaying(false);
    setSoundtrackTray(true);
    void prepareSoundtrack();
  };
})();
