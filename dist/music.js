(() => {
  'use strict';
  const host = document.getElementById('birthday-music');
  const tracks = window.BIRTHDAY.music || [];
  if (!host || !tracks.length) return;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const moods = [{id:'all',label:'All songs'},{id:'nostalgia',label:'Warm nostalgia'},{id:'indie',label:'Indie evenings'},{id:'wander',label:'Open skies'}];
  const storageKey = 'bhavyaa-soundtrack-selection';
  const duration = milliseconds => `${Math.floor(milliseconds / 60000)}:${String(Math.floor(milliseconds / 1000) % 60).padStart(2,'0')}`;
  let selected = -1, mood = 'all', query = '', visible = tracks.map((_,index) => index);
  let remembered;
  try { remembered = localStorage.getItem(storageKey); } catch {}
  host.innerHTML = `<section class="music-section content-width" aria-labelledby="music-title">
    <div class="music-heading"><div class="music-intro"><p class="eyebrow">THE BIRTHDAY SOUNDTRACK</p><h2 id="music-title">Some songs<br>feel like <em>home.</em></h2><p class="music-description">For slow mornings, familiar feelings, and the roads ahead.<br> A little Hindi nostalgia, handpicked for your day.</p><p class="music-collection-meta"><span>${tracks.length} SONGS</span><i></i><span>THREE LITTLE MOODS</span><i></i><span>YOURS TO EXPLORE</span></p></div><div class="music-record" aria-hidden="true"><div class="music-record-label"><span>BHAVYAA</span><i></i><small>27 OCT · SIDE A</small></div><div class="music-needle"></div></div></div>
    <div class="music-workspace">
      <div class="music-console" id="music-player" tabindex="-1" role="region" aria-label="Selected song and Spotify player"><div class="music-console-top"><span class="music-spotify">● SPOTIFY</span><span>ON YOUR TURNTABLE</span></div><div class="music-selected"><img class="music-selected-cover" alt="" width="64" height="64"><div><span class="music-selected-caption">SELECTED FOR YOU</span><h3 class="music-selected-title"></h3><p class="music-selected-artists"></p></div></div><div class="music-embed-wrap"></div><div class="music-player-controls"><button type="button" class="music-step" data-step="-1" aria-label="Load previous song">‹</button><span class="music-position"></span><button type="button" class="music-step" data-step="1" aria-label="Load next song">›</button><button type="button" class="music-surprise"><span aria-hidden="true">✦</span> Surprise me</button></div><div class="music-foot"><span>Choose a song, then press play.</span><a class="music-open" target="_blank" rel="noopener noreferrer">Open in Spotify ↗</a></div><p class="music-availability">Spotify may play a preview or ask you to sign in. Full-song playback depends on your account and region.</p><button type="button" class="music-browse">Explore the songs <span aria-hidden="true">↓</span></button></div>
      <div class="music-library" id="music-library" tabindex="-1" role="region" aria-label="Birthday song collection"><div class="music-library-heading"><div><p class="music-library-kicker">THE COLLECTION</p><h3>A song for <em>this moment.</em></h3></div><span class="music-total">${String(tracks.length).padStart(2,'0')}</span></div><div class="music-moods" role="group" aria-label="Filter songs by mood">${moods.map(item=>`<button type="button" data-mood="${item.id}" aria-pressed="${item.id==='all'}">${item.label}</button>`).join('')}</div><div class="music-search-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" class="music-search" aria-label="Search songs or artists" placeholder="Find a song or an artist" autocomplete="off"><button type="button" class="music-clear" aria-label="Clear song search" hidden>×</button></div><div class="music-list-topline"><span class="music-results" role="status" aria-live="polite"></span><span>SELECT TO LOAD</span></div><ol class="music-track-list" aria-label="Birthday songs"></ol><div class="music-empty" hidden><span aria-hidden="true">✦</span><p>No songs found for this moment.</p><button type="button" class="music-reset-filters">Show all songs</button></div><div class="music-library-foot"><span>Scroll to discover a little more.</span><button type="button" class="music-back-player">Back to the player ↑</button></div></div>
    </div><p class="music-status" role="status" aria-live="polite" aria-atomic="true"></p>
  </section>`;
  const wrap = host.querySelector('.music-embed-wrap');
  const list = host.querySelector('.music-track-list');
  const search = host.querySelector('.music-search');
  const clear = host.querySelector('.music-clear');
  const status = host.querySelector('.music-status');
  const filterButtons = [...host.querySelectorAll('[data-mood]')];
  const stepButtons = [...host.querySelectorAll('[data-step]')];
  const shuffle = host.querySelector('.music-surprise');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function syncSelection() {
    host.querySelectorAll('[data-track]').forEach(button => {
      const active = Number(button.dataset.track) === selected;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
      button.querySelector('.music-track-symbol').textContent = active ? '✦' : '↗';
    });
    stepButtons.forEach(button => { button.disabled = visible.length === 0; });
    shuffle.disabled = visible.length === 0;
    host.querySelector('.music-position').textContent = `${String(selected + 1).padStart(2,'0')} / ${String(tracks.length).padStart(2,'0')}`;
  }
  function choose(index, announce = true) {
    if (!tracks[index]) return;
    if (index === selected) {
      if (announce) status.textContent = `${tracks[index].title} is already loaded. Press play in the Spotify player.`;
      return;
    }
    selected = index;
    const track = tracks[index];
    const iframe = document.createElement('iframe');
    iframe.src = track.embedUrl;
    iframe.title = `Spotify player: ${track.title}`;
    iframe.width = '100%'; iframe.height = '152';
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    wrap.replaceChildren(iframe);
    host.querySelector('.music-selected-cover').src = track.cover;
    host.querySelector('.music-selected-title').textContent = track.title;
    host.querySelector('.music-selected-artists').textContent = track.artists;
    host.querySelector('.music-open').href = track.url;
    syncSelection();
    try { localStorage.setItem(storageKey, track.uri); } catch {}
    if (announce) status.textContent = `${track.title} selected. Press play in the Spotify player.`;
  }
  function renderList() {
    const needle = query.trim().toLocaleLowerCase();
    visible = tracks.flatMap((track,index) => ((mood === 'all' || track.moods.includes(mood)) && `${track.title} ${track.artists}`.toLocaleLowerCase().includes(needle)) ? [index] : []);
    list.innerHTML = visible.map(index => {
      const track = tracks[index];
      return `<li><button type="button" class="music-track" data-track="${index}" aria-pressed="false" aria-label="Load ${escape(track.title)} in the Spotify player"><span class="music-track-number">${String(index+1).padStart(2,'0')}</span><img class="music-track-cover" src="${escape(track.cover)}" alt="" width="42" height="42" loading="lazy"><span class="music-track-copy"><strong>${escape(track.title)}</strong><small>${escape(track.artists)}</small></span><span class="music-track-duration">${duration(track.durationMs)}</span><span class="music-track-symbol" aria-hidden="true">↗</span></button></li>`;
    }).join('');
    host.querySelector('.music-empty').hidden = visible.length > 0;
    list.hidden = visible.length === 0;
    host.querySelector('.music-results').textContent = `${visible.length} ${visible.length === 1 ? 'song' : 'songs'}${needle ? ' found' : ''}`;
    clear.hidden = query.length === 0;
    filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mood === mood)));
    syncSelection();
  }
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-track]');
    if (button && list.contains(button)) choose(Number(button.dataset.track));
  });
  filterButtons.forEach(button => button.addEventListener('click', () => { mood = button.dataset.mood; renderList(); }));
  search.addEventListener('input', () => { query = search.value; renderList(); });
  clear.addEventListener('click', () => { query = ''; search.value = ''; renderList(); search.focus(); });
  host.querySelector('.music-reset-filters').addEventListener('click', () => {
    mood = 'all'; query = ''; search.value = ''; renderList(); search.focus();
  });
  stepButtons.forEach(button => button.addEventListener('click', () => {
    if (!visible.length) return;
    const direction = Number(button.dataset.step);
    const position = visible.indexOf(selected);
    const next = position === -1 ? (direction > 0 ? 0 : visible.length - 1) : (position + direction + visible.length) % visible.length;
    choose(visible[next]);
  }));
  shuffle.addEventListener('click', () => {
    const alternatives = visible.filter(index => index !== selected);
    const pool = alternatives.length ? alternatives : visible;
    if (pool.length) choose(pool[Math.floor(Math.random() * pool.length)]);
  });
  function scrollTo(selector) {
    const destination = host.querySelector(selector);
    destination.focus({preventScroll:true});
    destination.scrollIntoView({behavior:reducedMotion.matches ? 'instant' : 'smooth',block:'start'});
  }
  host.querySelector('.music-browse').addEventListener('click', () => scrollTo('.music-library'));
  host.querySelector('.music-back-player').addEventListener('click', () => scrollTo('.music-console'));
  document.addEventListener('birthday:film-open', () => {
    // Replacing the library embed stops its audio before the film soundtrack opens.
    const frame = wrap.querySelector('iframe');
    if (frame) wrap.replaceChildren(frame.cloneNode());
  });
  const savedIndex = tracks.findIndex(track => track.uri === remembered);
  renderList();
  choose(savedIndex >= 0 ? savedIndex : 0, false);
})();
