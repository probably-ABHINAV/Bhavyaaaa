(() => {
  'use strict';

  const host = document.getElementById('personal-photos');
  const photos = Array.isArray(window.BIRTHDAY?.photos) ? window.BIRTHDAY.photos : [];
  const validPhoto = index => Number.isInteger(index) && photos[index] && typeof photos[index].image === 'string' && photos[index].image.trim();
  const allIndices = photos.map((photo, index) => index).filter(validPhoto);
  if (!host || !allIndices.length) return;

  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const countLabel = count => `${count} ${count === 1 ? 'photo' : 'photos'}`;
  const frameName = index => {
    const title = photos[index].title;
    return typeof title === 'string' && title.trim() ? title.trim() : `Frame ${String(allIndices.indexOf(index) + 1).padStart(2, '0')}`;
  };
  const collections = (Array.isArray(window.BIRTHDAY.collections) ? window.BIRTHDAY.collections : []).map((collection, index) => {
    if (!collection || !Array.isArray(collection.indices)) return null;
    const indices = [...new Set(collection.indices.filter(validPhoto))];
    if (!indices.length) return null;
    return {
      id: String(collection.id || index + 1).replace(/[^a-z0-9-]/gi, '').toLowerCase(),
      title: typeof collection.title === 'string' && collection.title.trim() ? collection.title.trim() : `Collection ${index + 1}`,
      kicker: typeof collection.kicker === 'string' && collection.kicker.trim() ? collection.kicker.trim() : 'A PHOTO COLLECTION',
      cover: typeof collection.cover === 'string' && collection.cover.trim() ? collection.cover : validPhoto(collection.cover) ? photos[collection.cover].image : photos[indices[0]].image,
      position: typeof collection.position === 'string' ? collection.position : '50% 50%',
      indices
    };
  }).filter(Boolean);
  if (!collections.length) collections.push({ id: 'complete', title: 'The complete collection', kicker: 'EVERY FRAME, ALL TOGETHER', cover: photos[allIndices[0]].image, position: '50% 50%', indices: allIndices });

  const section = document.createElement('section');
  section.className = 'gallery-section content-width';
  section.setAttribute('aria-labelledby', 'gallery-title');
  section.innerHTML = `
    <div class="gallery-heading">
      <div class="gallery-heading-copy"><p class="gallery-eyebrow">THE BHAVYAA COLLECTION</p><h2 id="gallery-title">Every version of you<span>.</span></h2></div>
      <div class="gallery-heading-actions">
        <button type="button" class="gallery-view-all" aria-controls="gallery-all-photos" aria-expanded="false"><span>View all ${countLabel(allIndices.length)}</span>${icon('arrow')}</button>
        <div class="gallery-scroll-controls"><button type="button" class="gallery-control gallery-scroll-prev" aria-label="Previous collections">${icon('chevron')}</button><button type="button" class="gallery-control gallery-scroll-next" aria-label="Next collections">${icon('chevron')}</button></div>
      </div>
    </div>
    <a class="gallery-skip-link" href="#episodes">Skip photo gallery</a>
    <div class="gallery-collections-panel">
      <div class="gallery-track" aria-label="Photo collections"></div>
      <div class="gallery-rail-footer"><p>${String(collections.length).padStart(2, '0')} COLLECTIONS <span>·</span> ${String(allIndices.length).padStart(2, '0')} FRAMES <span>·</span> ONE MAIN CHARACTER</p><div class="gallery-rail-progress" aria-hidden="true"><span></span></div></div>
    </div>
    <div class="gallery-all-panel" id="gallery-all-photos" hidden>
      <div class="gallery-grid-intro"><span>THE COMPLETE COLLECTION</span><p>Every frame, all together.</p><span>${countLabel(allIndices.length)}</span></div>
      <div class="gallery-photo-grid" aria-label="All photos of Bhavyaa"></div>
      <div class="gallery-grid-outro"><span>YOU’VE SEEN EVERY FRAME.</span><button type="button" class="gallery-return">${icon('arrow')} Back to collections</button></div>
    </div>`;
  host.append(section);

  section.querySelector('.gallery-skip-link').addEventListener('click', event => {
    const destination = document.getElementById('episodes');
    if (!destination) return;
    event.preventDefault();
    const hadTabindex = destination.hasAttribute('tabindex');
    if (!hadTabindex) destination.setAttribute('tabindex', '-1');
    destination.focus({ preventScroll: true });
    destination.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    if (!hadTabindex) destination.addEventListener('blur', () => destination.removeAttribute('tabindex'), { once: true });
  });

  const track = section.querySelector('.gallery-track');
  const collectionCards = collections.map((collection, index) => {
    const card = document.createElement('article');
    card.className = `gallery-collection-card gallery-collection--${collection.id}`;
    const poster = document.createElement('button');
    poster.type = 'button';
    poster.className = 'gallery-poster';
    poster.setAttribute('aria-haspopup', 'dialog');
    poster.setAttribute('aria-label', `Open ${collection.title}, ${countLabel(collection.indices.length)}`);
    poster.innerHTML = `<img class="gallery-poster-image" alt="" loading="lazy" decoding="async"><span class="gallery-poster-shade" aria-hidden="true"></span><span class="gallery-poster-brand" aria-hidden="true">B</span><span class="gallery-poster-copy" aria-hidden="true"><span class="gallery-poster-kicker"></span><span class="gallery-poster-title"></span></span><span class="gallery-poster-bottom" aria-hidden="true"><span>${countLabel(collection.indices.length)}</span><span class="gallery-poster-explore">Explore ${icon('arrow')}</span></span>`;
    poster.querySelector('img').src = collection.cover;
    poster.querySelector('img').style.objectPosition = collection.position;
    poster.querySelector('.gallery-poster-kicker').textContent = collection.kicker;
    poster.querySelector('.gallery-poster-title').textContent = collection.title;
    const rank = document.createElement('span');
    rank.className = 'gallery-rank';
    rank.textContent = String(index + 1).padStart(2, '0');
    rank.setAttribute('aria-hidden', 'true');
    card.append(poster, rank);
    poster.addEventListener('click', () => openPhoto(0, poster, collection.indices, collection.title));
    track.append(card);
    return card;
  });

  const allPanel = section.querySelector('.gallery-all-panel');
  const collectionsPanel = section.querySelector('.gallery-collections-panel');
  const scrollControls = section.querySelector('.gallery-scroll-controls');
  const toggle = section.querySelector('.gallery-view-all');
  const grid = section.querySelector('.gallery-photo-grid');
  let allRendered = false;
  let allVisible = false;

  function renderAllPhotos() {
    if (allRendered) return;
    allRendered = true;
    const fragment = document.createDocumentFragment();
    allIndices.forEach((photoIndex, index) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'gallery-grid-tile';
      tile.setAttribute('aria-haspopup', 'dialog');
      tile.setAttribute('aria-label', `Open ${frameName(photoIndex)}, photo ${index + 1} of ${allIndices.length}`);
      const image = document.createElement('img');
      image.src = photos[photoIndex].image;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      const caption = document.createElement('span');
      caption.className = 'gallery-grid-caption';
      caption.setAttribute('aria-hidden', 'true');
      const captionText = document.createElement('span');
      captionText.textContent = frameName(photoIndex);
      const expand = document.createElement('span');
      expand.className = 'gallery-grid-expand';
      expand.innerHTML = icon('plus');
      caption.append(captionText, expand);
      tile.append(image, caption);
      tile.addEventListener('click', () => openPhoto(index, tile, allIndices, 'The complete collection'));
      fragment.append(tile);
    });
    grid.append(fragment);
  }

  function setAllVisible(visible, returnToHeading = false) {
    allVisible = visible;
    if (visible) renderAllPhotos();
    allPanel.hidden = !visible;
    collectionsPanel.hidden = visible;
    scrollControls.hidden = visible;
    section.classList.toggle('gallery-all-visible', visible);
    toggle.setAttribute('aria-expanded', String(visible));
    toggle.querySelector('span').textContent = visible ? 'Back to collections' : `View all ${countLabel(allIndices.length)}`;
    if (!visible) requestAnimationFrame(updateScrollControls);
    if (returnToHeading) {
      toggle.focus({ preventScroll: true });
      section.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
  }
  toggle.addEventListener('click', () => setAllVisible(!allVisible));
  section.querySelector('.gallery-return').addEventListener('click', () => setAllVisible(false, true));

  const dialog = document.createElement('dialog');
  dialog.className = 'gallery-dialog';
  dialog.setAttribute('aria-labelledby', 'gallery-photo-title');
  dialog.innerHTML = `
    <div class="gallery-dialog-layout">
      <div class="gallery-dialog-header"><div><p class="gallery-dialog-eyebrow"><span>B</span> THE BHAVYAA COLLECTION</p><h2 id="gallery-photo-title"></h2></div><button type="button" class="gallery-control gallery-close" aria-label="Close photo" autofocus>${icon('close')}</button></div>
      <div class="gallery-photo-wrap"><img class="gallery-full-photo" alt="" decoding="async"><p class="gallery-photo-status" role="status" aria-live="polite" aria-atomic="true"></p></div>
      <div class="gallery-dialog-footer"><button type="button" class="gallery-control gallery-photo-prev" aria-label="Previous photo">${icon('chevron')}</button><div class="gallery-viewer-caption"><span class="gallery-viewer-frame"></span><p class="gallery-position" role="status" aria-live="polite" aria-atomic="true"></p></div><button type="button" class="gallery-control gallery-photo-next" aria-label="Next photo">${icon('chevron')}</button></div>
    </div>`;
  document.body.append(dialog);

  let modalImage = dialog.querySelector('.gallery-full-photo');
  const photoStatus = dialog.querySelector('.gallery-photo-status');
  const modalTitle = dialog.querySelector('#gallery-photo-title');
  const frameCaption = dialog.querySelector('.gallery-viewer-frame');
  const position = dialog.querySelector('.gallery-position');
  const previousPhoto = dialog.querySelector('.gallery-photo-prev');
  const nextPhoto = dialog.querySelector('.gallery-photo-next');
  let activeIndex = 0;
  let activeIndices = allIndices;
  let activeTitle = 'The complete collection';
  let opener;

  function showPhoto(index) {
    activeIndex = Math.max(0, Math.min(activeIndices.length - 1, index));
    const photoIndex = activeIndices[activeIndex];
    const photoImage = document.createElement('img');
    photoImage.className = 'gallery-full-photo gallery-photo-loading';
    photoImage.alt = `${frameName(photoIndex)} — ${activeTitle}`;
    photoImage.decoding = 'async';
    photoImage.setAttribute('aria-busy', 'true');
    photoImage.setAttribute('aria-hidden', 'true');
    photoStatus.textContent = 'Loading photo…';
    const finishLoading = loaded => {
      if (photoImage !== modalImage) return;
      photoImage.setAttribute('aria-busy', 'false');
      if (loaded) {
        photoImage.classList.remove('gallery-photo-loading');
        photoImage.removeAttribute('aria-hidden');
        photoStatus.textContent = '';
      } else {
        photoStatus.textContent = 'This photo could not load. Try another frame.';
      }
    };
    photoImage.addEventListener('load', () => finishLoading(true), { once: true });
    photoImage.addEventListener('error', () => finishLoading(false), { once: true });
    modalImage.replaceWith(photoImage);
    modalImage = photoImage;
    photoImage.src = photos[photoIndex].image;
    if (photoImage.complete) finishLoading(photoImage.naturalWidth > 0);
    modalTitle.textContent = activeTitle;
    frameCaption.textContent = frameName(photoIndex);
    position.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(activeIndices.length).padStart(2, '0')}`;
    previousPhoto.disabled = activeIndex === 0;
    nextPhoto.disabled = activeIndex === activeIndices.length - 1;
  }

  function openPhoto(index, tile, indices, title) {
    opener = tile;
    activeIndices = indices;
    activeTitle = title;
    showPhoto(index);
    dialog.showModal();
    document.body.classList.add('gallery-modal-open');
  }
  dialog.querySelector('.gallery-close').addEventListener('click', () => dialog.close());
  previousPhoto.addEventListener('click', () => showPhoto(activeIndex - 1));
  nextPhoto.addEventListener('click', () => showPhoto(activeIndex + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(activeIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('gallery-modal-open');
    if (!document.querySelector('dialog[open]') && opener?.isConnected) opener.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });

  const previousScroll = section.querySelector('.gallery-scroll-prev');
  const nextScroll = section.querySelector('.gallery-scroll-next');
  const railProgress = section.querySelector('.gallery-rail-progress span');
  function updateScrollControls() {
    if (allVisible) return;
    const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
    previousScroll.disabled = track.scrollLeft < 2;
    nextScroll.disabled = track.scrollLeft >= maximum - 2;
    const visibleFraction = Math.min(1, track.clientWidth / track.scrollWidth);
    railProgress.style.width = `${visibleFraction * 100}%`;
    railProgress.style.left = `${maximum ? Math.max(0, Math.min(1, track.scrollLeft / maximum)) * (1 - visibleFraction) * 100 : 0}%`;
  }
  function scrollCollections(direction) {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (collectionCards[0].getBoundingClientRect().width + gap), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
  previousScroll.addEventListener('click', () => scrollCollections(-1));
  nextScroll.addEventListener('click', () => scrollCollections(1));
  track.addEventListener('scroll', updateScrollControls, { passive: true });
  window.addEventListener('resize', updateScrollControls, { passive: true });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateScrollControls).observe(track);
  requestAnimationFrame(updateScrollControls);
})();
