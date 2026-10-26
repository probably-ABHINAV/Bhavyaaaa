/* A quiet birthday wish. Decorative motion only; no sound or stored state. */
(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sparkle = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  const relight = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1.5 8M4 3v7h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function mount() {
    const host = document.getElementById('birthday-wish');
    if (!host || host.querySelector('.wish-section')) return;
    const section = document.createElement('section');
    section.className = 'wish-section';
    section.setAttribute('aria-labelledby', 'wish-title');
    section.innerHTML = `
      <div class="wish-inner">
        <div class="wish-copy">
          <div class="wish-eyebrow"><span></span> A MOMENT JUST FOR YOU</div>
          <h2 id="wish-title">Before the next chapter,<br><em>make a wish.</em></h2>
          <p class="wish-description">Keep it to yourself.<br> Some things are just yours.</p>
          <button class="wish-button" type="button">${sparkle}<span>Make a wish</span></button>
          <div class="wish-response" role="status" aria-live="polite" aria-atomic="true"><span class="wish-response-text">One candle. Endless possibilities.</span></div>
        </div>
        <div class="wish-art" aria-hidden="true">
          <div class="wish-ambient"></div>
          <div class="wish-orbit wish-orbit-outer"></div><div class="wish-orbit wish-orbit-inner"></div>
          <span class="wish-orbit-star">✦</span><span class="wish-orbit-dot"></span>
          <div class="wish-candle-scene">
            <div class="wish-halo"></div>
            <div class="wish-candle">
              <div class="wish-flame"><span></span></div>
              <div class="wish-wick"></div>
              <div class="wish-smoke"><span></span><span></span></div>
              <div class="wish-wax-top"></div>
              <div class="wish-wax-mark"><span>27</span><small>OCTOBER</small></div>
              <div class="wish-wax-drip"></div>
            </div>
            <div class="wish-pedestal"><div class="wish-pedestal-surface"></div><div class="wish-pedestal-side"></div></div>
            <div class="wish-floor-glow"></div>
          </div>
          <div class="wish-burst"></div>
          <p class="wish-art-caption"><span class="wish-tiny-line"></span> A LITTLE LIGHT FOR WHAT COMES NEXT <span class="wish-tiny-line"></span></p>
        </div>
      </div>`;
    host.append(section);
    const button = section.querySelector('.wish-button');
    const response = section.querySelector('.wish-response-text');
    const burst = section.querySelector('.wish-burst');
    let wished = false;
    let cleanupTimer;

    function clearBurst() { window.clearTimeout(cleanupTimer); burst.replaceChildren(); }
    function celebrate() {
      if (motion.matches) return;
      clearBurst();
      const colors = ['#f3e4c9', '#e3464b', '#caa974', '#f3e4c9'];
      for (let index = 0; index < 18; index++) {
        const particle = document.createElement('span');
        const angle = (Math.PI * 2 * index) / 18;
        const reach = 60 + (index % 5) * 19;
        particle.className = 'wish-particle';
        particle.style.setProperty('--wish-x', `${Math.cos(angle) * reach}px`);
        particle.style.setProperty('--wish-y', `${Math.sin(angle) * reach - 35}px`);
        particle.style.setProperty('--wish-turn', `${index % 2 ? 165 : -195}deg`);
        particle.style.setProperty('--wish-delay', `${(index % 4) * 28}ms`);
        particle.style.setProperty('--wish-color', colors[index % colors.length]);
        if (index % 3 === 0) particle.classList.add('wish-particle-round');
        burst.append(particle);
      }
      cleanupTimer = window.setTimeout(clearBurst, 1800);
    }
    button.addEventListener('click', () => {
      wished = !wished;
      section.classList.toggle('wish-extinguished', wished);
      button.innerHTML = `${wished ? relight : sparkle}<span>${wished ? 'Light it again' : 'Make a wish'}</span>`;
      response.textContent = wished ? 'May this one come true.' : 'A little light, and another wish.';
      if (wished) celebrate(); else clearBurst();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
