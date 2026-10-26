(() => {
  'use strict';
  const host = document.getElementById('birthday-music');
  const tracks = window.BIRTHDAY.music || [];
  if (!host || !tracks.length) return;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  host.innerHTML = `<section class="music-section content-width" aria-labelledby="music-title">
    <div class="music-intro"><p class="eyebrow">THE BIRTHDAY SOUNDTRACK</p><h2 id="music-title">Some songs<br>feel like <em>home.</em></h2><p class="music-description">A few soft Hindi favourites for a little nostalgia.<br> Pick a song. Stay for a while.</p><div class="music-record" aria-hidden="true"><div class="music-record-label"><span>BHAVYAA</span><i></i><small>27 OCT · SIDE A</small></div><div class="music-needle"></div></div><span class="music-record-caption">THREE SONGS FOR A SLOWER MOMENT</span></div>
    <div class="music-console"><div class="music-console-top"><span class="music-spotify">● SPOTIFY</span><span>SELECT YOUR SOUNDTRACK</span></div><div class="music-track-list" role="group" aria-label="Choose a song">${tracks.map((track,index)=>`<button type="button" class="music-track ${index===0?'is-selected':''}" data-track="${index}" aria-pressed="${index===0}" aria-label="Load ${escape(track.title)} in the Spotify player"><span class="music-track-number">0${index+1}</span><span class="music-track-copy"><strong>${escape(track.title)}</strong><small>${escape(track.artists)}</small></span><svg class="icon" aria-hidden="true"><use href="#i-play"/></svg></button>`).join('')}</div><div class="music-embed-wrap"></div><div class="music-foot"><span>Press play in the player.</span><a class="music-open" target="_blank" rel="noopener noreferrer">Open in Spotify ↗</a></div><p class="music-availability">Playback and previews depend on Spotify availability.</p><p class="music-status" role="status" aria-live="polite"></p></div>
  </section>`;
  const wrap = host.querySelector('.music-embed-wrap');
  const open = host.querySelector('.music-open');
  const status = host.querySelector('.music-status');
  const buttons = [...host.querySelectorAll('[data-track]')];
  let selected = -1;
  function choose(index, announce) {
    if (index === selected) return;
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
    open.href = track.url;
    buttons.forEach((button, position) => {
      button.classList.toggle('is-selected', position === index);
      button.setAttribute('aria-pressed', String(position === index));
    });
    if (announce) status.textContent = `${track.title} selected. Press play in the Spotify player.`;
  }
  buttons.forEach(button => button.addEventListener('click', () => choose(Number(button.dataset.track), true)));
  choose(0, false);
})();
