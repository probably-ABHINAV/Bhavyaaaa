/* A sixty-second, local photo premiere. Audio starts only through its sound button. */
(() => {
  'use strict';
  const durations = [5, 8, 8, 8, 8, 8, 8, 7];
  const starts = durations.map((_, index) => durations.slice(0, index).reduce((sum, n) => sum + n, 0));
  const total = durations.reduce((sum, n) => sum + n, 0);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
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
  let frames = [], sceneIndex = -1, elapsed = 0, lastTick = 0, raf = 0;
  let running = false, active = false, previousFocus, audioEngine = null, soundEnabled = false, audioRequest = 0;

  function createAudio() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    const context = new Context();
    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    const voices = new Set();
    let timer = null, chord = 0, nextNote = 0;
    const chords = [[130.81, 164.81, 196, 261.63], [110, 130.81, 164.81, 220], [87.31, 130.81, 174.61, 220], [98, 146.83, 196, 246.94]];
    function tone(frequency, time, length, level) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(level, time + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
      oscillator.connect(gain); gain.connect(master);
      oscillator.start(time); oscillator.stop(time + length + 0.05);
      voices.add(oscillator);
      oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    }
    function schedule() {
      if (context.state !== 'running') return;
      if (nextNote < context.currentTime) nextNote = context.currentTime + 0.06;
      while (nextNote < context.currentTime + 0.3) {
        const notes = chords[chord % chords.length];
        notes.forEach((frequency, index) => tone(frequency, nextNote + index * 0.55, 5.5, 0.028));
        tone(notes[2] * 2, nextNote + 2.3, 3.4, 0.018);
        nextNote += 5.6; chord++;
      }
    }
    return {
      async start() {
        await context.resume();
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0.55, context.currentTime, 0.55);
        schedule(); timer = window.setInterval(schedule, 160);
      },
      pause() { void context.suspend().catch(() => {}); },
      resume() { void context.resume().catch(() => {}); },
      stop() {
        window.clearInterval(timer);
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0, context.currentTime, 0.035);
        voices.forEach(voice => { try { voice.stop(context.currentTime + 0.15); } catch (_) {} });
        window.setTimeout(() => { if (context.state !== 'closed') void context.close().catch(() => {}); }, 220);
      }
    };
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
        <footer class="cinema-controls">
          <div class="cinema-timeline" aria-label="Film chapters">${durations.map((duration, index) => `<button type="button" class="cinema-segment" style="--segment-weight:${duration}" data-cinema-scene="${index}" aria-label="Jump to chapter ${index + 1}"><span></span></button>`).join('')}</div>
          <div class="cinema-control-row"><div class="cinema-playback-group"><button type="button" class="cinema-icon-button cinema-playback" aria-label="Pause film">${icon('pause')}</button><button type="button" class="cinema-icon-button cinema-previous" aria-label="Previous chapter">${icon('previous')}</button><button type="button" class="cinema-icon-button cinema-next" aria-label="Next chapter">${icon('next')}</button><span class="cinema-clock">0:00 <span>/ 1:00</span></span></div><span class="cinema-scene-label">THE OPENING</span><button type="button" class="cinema-sound" aria-pressed="false">${icon('muted')}<span>Sound off</span></button></div>
        </footer>
      </div>`;
    document.body.append(dialog);
    stage = dialog.querySelector('.cinema-stage');
    playback = dialog.querySelector('.cinema-playback'); sound = dialog.querySelector('.cinema-sound');
    clock = dialog.querySelector('.cinema-clock'); sceneLabel = dialog.querySelector('.cinema-scene-label');
    announcer = dialog.querySelector('.cinema-announcer');
    segments = Array.from(dialog.querySelectorAll('.cinema-segment'));
    dialog.querySelector('.cinema-close').addEventListener('click', close);
    playback.addEventListener('click', togglePlayback);
    dialog.querySelector('.cinema-previous').addEventListener('click', () => jump(sceneIndex - 1));
    dialog.querySelector('.cinema-next').addEventListener('click', () => jump(sceneIndex + 1));
    segments.forEach((segment, index) => segment.addEventListener('click', () => jump(index)));
    sound.addEventListener('click', toggleSound);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', cleanup);
    dialog.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); jump(sceneIndex + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); jump(sceneIndex - 1); }
      if (event.key === ' ' && event.target === dialog) { event.preventDefault(); togglePlayback(); }
      if (event.key === 'Escape' && typeof dialog.showModal !== 'function') { event.preventDefault(); close(); }
      if (event.key === 'Tab' && typeof dialog.showModal !== 'function') {
        const focusable = Array.from(dialog.querySelectorAll('button:not(:disabled)')).filter(node => node.getClientRects().length);
        if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); }
        if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0]?.focus(); }
      }
    });
    if (!(window.AudioContext || window.webkitAudioContext)) {
      sound.disabled = true; sound.querySelector('span').textContent = 'Sound unavailable';
      sound.setAttribute('title', 'This browser does not support the optional soundtrack.');
    }
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
    if (audioEngine) { if (value) audioEngine.resume(); else audioEngine.pause(); }
    if (value && active) raf = requestAnimationFrame(tick);
  }
  function togglePlayback() { if (elapsed >= total) { jump(0); setPlaying(true); } else setPlaying(!running); }
  function jump(index) {
    if (!active) return;
    elapsed = starts[Math.max(0, Math.min(7, index))]; lastTick = 0;
    ending.hidden = true; dialog.classList.remove('cinema-ended'); draw();
    if (!running) { playback.innerHTML = icon('play'); playback.setAttribute('aria-label', 'Resume film'); }
  }
  async function toggleSound() {
    if (sound.disabled) return;
    if (soundEnabled) { stopSound(); return; }
    const request = ++audioRequest;
    try {
      const engine = createAudio();
      if (!engine) return;
      audioEngine = engine;
      await engine.start();
      if (!active || request !== audioRequest) { engine.stop(); return; }
      soundEnabled = true;
      sound.setAttribute('aria-pressed', 'true'); sound.innerHTML = `${icon('sound')}<span>Sound on</span>`;
      if (!running) engine.pause();
    } catch (_) {
      stopSound(); sound.disabled = true;
      sound.innerHTML = `${icon('muted')}<span>Sound unavailable</span>`;
    }
  }
  function stopSound() {
    audioRequest++; audioEngine?.stop(); audioEngine = null; soundEnabled = false;
    if (sound && !sound.disabled) { sound.setAttribute('aria-pressed', 'false'); sound.innerHTML = `${icon('muted')}<span>Sound off</span>`; }
  }
  function cleanup() {
    if (!active) return;
    active = false; running = false; cancelAnimationFrame(raf); stopSound();
    document.body.classList.remove('cinema-open');
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }
  function close() {
    if (!dialog || !active) return;
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    cleanup();
  }
  document.addEventListener('visibilitychange', () => {
    if (active && document.hidden && running) setPlaying(false);
  });
  window.openBirthdayPremiere = () => {
    if (active) return;
    buildDialog(); makeScenes();
    previousFocus = document.activeElement;
    elapsed = 0; sceneIndex = -1; active = true;
    frames.forEach(frame => frame.inert = true);
    dialog.classList.toggle('cinema-reduced-motion', motion.matches);
    dialog.classList.remove('cinema-ended');
    document.body.classList.add('cinema-open');
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    draw(); setPlaying(true);
    dialog.querySelector('.cinema-close').focus({ preventScroll: true });
  };
})();
