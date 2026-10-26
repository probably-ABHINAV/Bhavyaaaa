(() => {
  'use strict';
  const frames = window.BIRTHDAY.heroFrames || [];
  const images = [...document.querySelectorAll('.hero-photo')];
  const toggle = document.querySelector('.hero-frame-toggle');
  const label = document.querySelector('.hero-frame-label');
  const thumbnails = [...document.querySelectorAll('[data-hero-frame]')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let activeImage = 0;
  let paused = motion.matches;
  let timer;
  let request = 0;

  function syncControls() {
    label.textContent = `${String(current + 1).padStart(2, '0')} / ${String(frames.length).padStart(2, '0')}`;
    toggle.setAttribute('aria-label', paused ? 'Play featured photos' : 'Pause featured photos');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-${paused ? 'play' : 'pause'}"/></svg>`;
    thumbnails.forEach((button, index) => {
      button.classList.toggle('is-active', index === current);
      button.setAttribute('aria-pressed', String(index === current));
    });
  }
  function schedule() {
    clearTimeout(timer);
    if (!paused && !document.hidden) timer = setTimeout(() => {
      if (document.querySelector('dialog[open]')) schedule();
      else showFrame(current + 1);
    }, 8000);
  }
  async function showFrame(index) {
    const targetIndex = (index + frames.length) % frames.length;
    const frame = frames[targetIndex];
    const version = ++request;
    const incoming = images[1 - activeImage];
    incoming.src = frame.image;
    incoming.style.objectPosition = frame.position || '50% 40%';
    try { await incoming.decode(); } catch { schedule(); return; }
    if (version !== request) return;
    images[activeImage].classList.remove('is-current');
    incoming.classList.add('is-current');
    activeImage = 1 - activeImage;
    current = targetIndex;
    syncControls();
    schedule();
  }
  if (frames.length && images.length === 2) {
    images[0].style.objectPosition = frames[0].position || '50% 40%';
    document.querySelector('.hero-frame-prev').addEventListener('click', () => showFrame(current - 1));
    document.querySelector('.hero-frame-next').addEventListener('click', () => showFrame(current + 1));
    toggle.addEventListener('click', () => { paused = !paused; syncControls(); schedule(); });
    thumbnails.forEach(button => button.addEventListener('click', () => {
      paused = true;
      clearTimeout(timer);
      syncControls();
      showFrame(Number(button.dataset.heroFrame));
    }));
    document.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', () => { paused = motion.matches; syncControls(); schedule(); });
    syncControls();
    schedule();
  }

  const header = document.getElementById('site-header');
  const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const syncHeader = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 35);
    let selected = navLinks[0];
    let nearestTop = -Infinity;
    navLinks.forEach(link => {
      const section = document.querySelector(link.getAttribute('href'));
      const top = section?.getBoundingClientRect().top;
      if (top !== undefined && top <= 160 && top > nearestTop) { selected = link; nearestTop = top; }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link === selected);
      if (link === selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();
  if ('IntersectionObserver' in window && !motion.matches) {
    const reveals = document.querySelectorAll('.section-heading, .letter-banner, .countdown-panel, .site-footer');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    reveals.forEach(element => { element.classList.add('reveal'); observer.observe(element); });
    document.body.classList.add('motion-ready');
  }
})();
