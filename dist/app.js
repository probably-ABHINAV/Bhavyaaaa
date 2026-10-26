(() => {
  'use strict';
  const { episodes, letter, birthday } = window.BIRTHDAY;
  const $ = (selector) => document.querySelector(selector);
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const escape = (value) => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const storageKey = 'bhavyaa-birthday-saved-v1';
  let saved = new Set();
  let toastTimer;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) saved = new Set(stored.filter(id => episodes.some(episode => episode.id === id)));
  } catch { /* The experience also works when browser storage is unavailable. */ }

  $('#episodes-track').innerHTML = episodes.map((episode, index) => `
    <article class="episode-card">
      <div class="episode-image-wrap">
        <button type="button" class="episode-play" data-episode="${index}" aria-label="Open episode ${index + 1}: ${escape(episode.title)}">
          <img src="${episode.image}" alt="" loading="lazy" width="600" height="750" style="object-position:${episode.position || '50% 40%'}">
          <span class="episode-tag" aria-hidden="true">B</span>
          <span class="episode-name-overlay" aria-hidden="true">${escape(episode.title)}</span>
          <span class="episode-hover-play" aria-hidden="true">${icon('play')}</span>
        </button>
        <button type="button" class="circle-button save-button" data-save="${episode.id}" aria-pressed="false" aria-label="Save ${escape(episode.title)} to my list">${icon('plus')}</button>
      </div>
      <div class="episode-details"><span class="episode-number">0${index + 1}</span><h3>${escape(episode.title)}</h3><span class="episode-duration">${escape(episode.genre)}</span></div>
      <p class="episode-caption">${escape(episode.subtitle)}</p>
    </article>`).join('');
  $('#letter-body').innerHTML = letter.map(paragraph => `<p>${escape(paragraph)}</p>`).join('');

  function notify(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2800);
  }

  function syncSaved() {
    document.querySelectorAll('[data-save]').forEach(button => {
      const active = saved.has(button.dataset.save);
      const episode = episodes.find(item => item.id === button.dataset.save);
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', `${active ? 'Remove' : 'Save'} ${episode.title} ${active ? 'from' : 'to'} my list`);
      button.innerHTML = icon(active ? 'check' : 'plus');
    });
    $('#saved-count').textContent = saved.size ? ` (${saved.size})` : '';
  }

  function toggleSaved(id) {
    if (saved.has(id)) { saved.delete(id); notify('Removed from your list'); }
    else { saved.add(id); notify('A little good, saved to your list'); }
    try { localStorage.setItem(storageKey, JSON.stringify([...saved])); } catch { notify('Saved for this visit. Browser storage is unavailable.'); }
    syncSaved();
    if ($('#list-dialog').open) renderSaved();
  }

  function renderSaved() {
    const focusedRemove = document.activeElement?.closest('[data-remove]');
    const focusedIndex = focusedRemove ? [...$('#saved-items').querySelectorAll('[data-remove]')].indexOf(focusedRemove) : -1;
    const items = episodes.filter(episode => saved.has(episode.id));
    $('#saved-items').innerHTML = items.length ? items.map(episode => `<div class="saved-row"><button type="button" class="saved-open" data-saved-episode="${episodes.indexOf(episode)}"><img src="${episode.image}" alt=""><span><strong>${escape(episode.title)}</strong><small>${escape(episode.subtitle)}</small></span></button><button type="button" class="circle-button" data-remove="${episode.id}" aria-label="Remove ${escape(episode.title)} from my list">${icon('close')}</button></div>`).join('') : `<div class="empty-list">${icon('bookmark')}<p>A little good is always worth keeping.<br>Use the + on any episode to save it here.</p><button type="button" class="button button-light" id="explore-episodes">Explore your episodes ${icon('arrow')}</button></div>`;
    if (focusedIndex >= 0) {
      const buttons = [...$('#saved-items').querySelectorAll('[data-remove]')];
      (buttons[Math.min(focusedIndex, buttons.length - 1)] || $('#explore-episodes'))?.focus();
    }
  }

  let returnFocus;
  function openDialog(id) {
    if (!document.activeElement?.closest('dialog')) returnFocus = document.activeElement;
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    $('#' + id).showModal();
    document.body.classList.add('modal-open');
  }
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      if (dialog.id === 'story-dialog') stopStory();
      if (!document.querySelector('dialog[open]')) {
        document.body.classList.remove('modal-open');
        if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
      }
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-open-letter')) openDialog('letter-dialog');
    if (button.dataset.close) $('#' + button.dataset.close).close();
    if (button.dataset.episode !== undefined) openStory(Number(button.dataset.episode), false);
    if (button.dataset.save) toggleSaved(button.dataset.save);
    if (button.dataset.remove) toggleSaved(button.dataset.remove);
    if (button.dataset.savedEpisode !== undefined) openStory(Number(button.dataset.savedEpisode), false);
    if (button.id === 'explore-episodes') { $('#list-dialog').close(); $('#episodes').scrollIntoView({behavior: reducedMotion ? 'instant' : 'smooth'}); }
  });
  $('#my-list-button').addEventListener('click', () => { renderSaved(); openDialog('list-dialog'); });

  const track = $('#episodes-track');
  function scrollEpisodes(direction) {
    track.scrollBy({left: direction * (track.querySelector('.episode-card').getBoundingClientRect().width + 18), behavior: reducedMotion ? 'instant' : 'smooth'});
  }
  function updateScrollButtons() {
    const maxScroll = track.scrollWidth - track.clientWidth;
    $('#episodes-prev').disabled = track.scrollLeft < 2;
    $('#episodes-next').disabled = track.scrollLeft >= maxScroll - 2;
  }
  $('#episodes-prev').addEventListener('click', () => scrollEpisodes(-1));
  $('#episodes-next').addEventListener('click', () => scrollEpisodes(1));
  track.addEventListener('scroll', updateScrollButtons, {passive: true});
  window.addEventListener('resize', updateScrollButtons, {passive: true});

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let storyIndex = 0;
  let playing = false;
  let storyInterval;
  let elapsed = 0;
  let lastTick = 0;
  const storyDuration = 12000;
  $('#story-progress').innerHTML = episodes.map(() => '<span><i></i></span>').join('');
  function updateProgress() {
    $('#story-progress').querySelectorAll('i').forEach((bar, index) => {
      bar.style.width = index < storyIndex ? '100%' : index === storyIndex ? `${elapsed / storyDuration * 100}%` : '0%';
    });
  }
  function showStory(index) {
    storyIndex = Math.max(0, Math.min(episodes.length - 1, index));
    elapsed = 0;
    lastTick = performance.now();
    const episode = episodes[storyIndex];
    $('#story-image').src = episode.image;
    $('#story-image').style.objectPosition = episode.position || '50% 40%';
    $('#story-eyebrow').textContent = `EPISODE 0${storyIndex + 1} · ${episode.tag}`;
    $('#story-title').textContent = episode.heading;
    $('#story-body').textContent = episode.message;
    $('#story-position').textContent = `${storyIndex + 1} / ${episodes.length}`;
    $('#story-prev').disabled = storyIndex === 0;
    $('#story-next').innerHTML = `${storyIndex === episodes.length - 1 ? 'Read your letter' : 'Next wish'} ${icon('arrow')}`;
    updateProgress();
  }
  function syncPlaying() {
    $('#story-pause').setAttribute('aria-label', playing ? 'Pause birthday special' : 'Play birthday special');
    $('#story-pause').innerHTML = icon(playing ? 'pause' : 'play');
  }
  function stopStory() { clearInterval(storyInterval); storyInterval = undefined; playing = false; syncPlaying(); }
  function openStory(index, autoplay) {
    openDialog('story-dialog');
    // A previous dialog's deferred close event can fire after the new dialog opens.
    stopStory();
    showStory(index);
    playing = autoplay && !reducedMotion;
    syncPlaying();
    storyInterval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTick;
      lastTick = now;
      if (!playing || document.hidden || !$('#story-dialog').open) return;
      elapsed = Math.min(storyDuration, elapsed + delta);
      updateProgress();
      if (elapsed >= storyDuration) {
        if (storyIndex < episodes.length - 1) showStory(storyIndex + 1);
        else { playing = false; syncPlaying(); }
      }
    }, 100);
  }
  $('#play-special').addEventListener('click', () => {
    if (typeof window.openBirthdayPremiere === 'function') window.openBirthdayPremiere();
    else openStory(0, true);
  });
  $('#story-pause').addEventListener('click', () => {
    if (elapsed >= storyDuration && storyIndex === episodes.length - 1) showStory(0);
    playing = !playing;
    lastTick = performance.now();
    syncPlaying();
  });
  $('#story-prev').addEventListener('click', () => showStory(storyIndex - 1));
  $('#story-next').addEventListener('click', () => {
    if (storyIndex === episodes.length - 1) openDialog('letter-dialog');
    else showStory(storyIndex + 1);
  });
  $('#story-dialog').addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' && storyIndex < episodes.length - 1) { event.preventDefault(); showStory(storyIndex + 1); }
    if (event.key === 'ArrowLeft' && storyIndex > 0) { event.preventDefault(); showStory(storyIndex - 1); }
  });

  const birthdayTime = new Date(birthday).getTime();
  function updateCountdown() {
    const now = Date.now();
    const difference = Math.max(0, birthdayTime - now);
    if (difference === 0) {
      const isBirthday = now < birthdayTime + 86400000;
      $('#countdown-eyebrow').textContent = isBirthday ? 'THE PREMIERE IS HERE' : 'A NEW CHAPTER HAS BEGUN';
      $('#countdown').classList.add('is-birthday');
      $('#countdown').removeAttribute('role');
      $('#countdown').removeAttribute('aria-label');
      $('#countdown').textContent = isBirthday ? 'Today is all yours, Bhavyaa.' : 'Here’s to your next chapter.';
      $('#countdown-date').textContent = 'Celebrating you · 27 October 2026';
      $('#countdown-wish').textContent = 'Happy birthday. May this be a beautiful year.';
      return;
    }
    const units = {days: Math.floor(difference / 86400000), hours: Math.floor(difference / 3600000) % 24, minutes: Math.floor(difference / 60000) % 60, seconds: Math.floor(difference / 1000) % 60};
    Object.entries(units).forEach(([unit, value]) => $('#count-' + unit).textContent = String(value).padStart(2, '0'));
  }
  syncSaved();
  updateScrollButtons();
  updateCountdown();
  setInterval(updateCountdown, 1000);
})();
