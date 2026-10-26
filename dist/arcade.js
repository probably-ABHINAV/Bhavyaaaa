/* Two local photo games. No tracking, network calls, time limits, or sound. */
(() => {
  'use strict';
  const photoIndices = [0, 11, 16, 24, 26, 30];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const closeIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const arrowIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let dialog, content, opener, game = null, memory = null, puzzle = null, mismatchTimer = 0, session = 0;
  let boardButtons = [], counter, status, completion, hintButton, reference;

  function photo(index) {
    const data = window.BIRTHDAY || {};
    const item = data.photos?.[index] || data.photos?.[0] || {};
    return { image: item.image || item.src || 'assets/hero.jpg', title: item.title || 'A birthday portrait' };
  }
  function shuffle(values) {
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }
  function cancelPending() { session++; window.clearTimeout(mismatchTimer); mismatchTimer = 0; }
  function say(message) { if (status) status.textContent = message; }
  function updateCounter(moves) { counter.textContent = `${moves} ${moves === 1 ? 'move' : 'moves'}`; }

  function mount() {
    const host = document.getElementById('birthday-arcade');
    if (!host || host.querySelector('.arcade-section')) return;
    const section = document.createElement('section');
    section.className = 'arcade-section';
    section.setAttribute('aria-labelledby', 'arcade-title');
    section.innerHTML = `<div class="arcade-section-heading"><div><p class="arcade-eyebrow">THE BIRTHDAY ARCADE</p><h2 id="arcade-title">A little play. <em>A lot of you.</em></h2></div><p class="arcade-section-note">No rush. No high scores.<br>Just a little something to make you smile.</p></div>
      <div class="arcade-entry-grid">
        <button type="button" class="arcade-entry arcade-entry-memory" data-arcade-game="memory" aria-label="Play Match the moments, a six-pair photo memory game">
          <div class="arcade-entry-art arcade-memory-art" aria-hidden="true"><div class="arcade-art-glow"></div>${[0, 24, 30, 16].map((index, slot) => `<span class="arcade-preview-card arcade-preview-${slot}"><img src="${escape(photo(index).image)}" alt="" loading="lazy" draggable="false"></span>`).join('')}<span class="arcade-art-word">a perfect<br><em>match.</em></span></div>
          <div class="arcade-entry-copy"><span class="arcade-entry-number">01</span><div><span class="arcade-entry-category">THE MEMORY GAME · 6 PAIRS</span><h3>Match the moments.</h3><p>A few familiar frames. Can you find their other halves?</p></div><span class="arcade-entry-arrow">${arrowIcon}</span></div>
          <span class="arcade-entry-cta">LET’S PLAY <span aria-hidden="true">↗</span></span>
        </button>
        <button type="button" class="arcade-entry arcade-entry-puzzle" data-arcade-game="puzzle" aria-label="Play Piece it together, a nine-piece portrait puzzle">
          <div class="arcade-entry-art arcade-puzzle-art" aria-hidden="true"><div class="arcade-art-glow"></div><span class="arcade-art-word">one lovely<br><em>picture.</em></span><div class="arcade-preview-puzzle">${[0, 4, 2, 3, 1, 5, 6, 8, 7].map((tile, index) => `<span class="arcade-preview-tile" style="--tile-x:${(tile % 3) * 50}%;--tile-y:${Math.floor(tile / 3) * 50}%;background-image:url('${escape(photo(30).image)}')"><i>${index + 1}</i></span>`).join('')}</div></div>
          <div class="arcade-entry-copy"><span class="arcade-entry-number">02</span><div><span class="arcade-entry-category">THE PORTRAIT PUZZLE · 9 PIECES</span><h3>Piece it together.</h3><p>One photo, a little out of order. Make it whole again.</p></div><span class="arcade-entry-arrow">${arrowIcon}</span></div>
          <span class="arcade-entry-cta">YOUR MOVE <span aria-hidden="true">↗</span></span>
        </button>
      </div>`;
    host.append(section);
    section.querySelectorAll('[data-arcade-game]').forEach(button => button.addEventListener('click', () => openGame(button.dataset.arcadeGame, button)));
  }

  function createDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'arcade-dialog';
    dialog.setAttribute('aria-labelledby', 'arcade-dialog-title');
    dialog.innerHTML = `<div class="arcade-modal-header"><div><p class="arcade-eyebrow">THE BIRTHDAY ARCADE</p><h2 id="arcade-dialog-title"></h2></div><button type="button" class="arcade-close" aria-label="Close game">${closeIcon}</button></div><div class="arcade-game-content"></div>`;
    document.body.append(dialog);
    content = dialog.querySelector('.arcade-game-content');
    dialog.querySelector('.arcade-close').addEventListener('click', closeGame);
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeGame(); });
    dialog.addEventListener('close', cleanup);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeGame();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape' && typeof dialog.showModal !== 'function') { event.preventDefault(); closeGame(); }
      if (event.key === 'Tab' && typeof dialog.showModal !== 'function') {
        const buttons = Array.from(dialog.querySelectorAll('button')).filter(button => !button.disabled && button.getClientRects().length);
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
        if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
      }
    });
  }
  function openGame(kind, trigger) {
    createDialog(); cancelPending();
    game = kind; opener = trigger;
    dialog.dataset.game = kind;
    document.body.classList.add('arcade-open');
    dialog.querySelector('#arcade-dialog-title').textContent = kind === 'memory' ? 'Match the moments.' : 'Piece it together.';
    if (kind === 'memory') buildMemory(); else buildPuzzle();
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    }
    dialog.querySelector('.arcade-close').focus({ preventScroll: true });
  }
  function cleanup() {
    if (!game) return;
    cancelPending(); game = null; memory = null; puzzle = null;
    document.body.classList.remove('arcade-open');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }
  function closeGame() {
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
    cleanup();
  }
  function gameChrome(instructions, body, isPuzzle = false) {
    content.innerHTML = `<p class="arcade-instructions">${instructions}</p><div class="arcade-toolbar"><div class="arcade-score"><span class="arcade-moves">0 moves</span><span class="arcade-score-divider"></span><span class="arcade-progress">${isPuzzle ? 'Put the numbers in order' : '0 / 6 pairs'}</span></div><div class="arcade-game-actions">${isPuzzle ? '<button type="button" class="arcade-hint" aria-expanded="false" aria-controls="arcade-reference">Show a hint</button>' : ''}<button type="button" class="arcade-reset">${isPuzzle ? 'Shuffle again' : 'Start again'} <span aria-hidden="true">↻</span></button></div></div>${body}<div class="arcade-feedback"><p class="arcade-status" role="status" aria-live="polite" aria-atomic="true"></p><div class="arcade-completion" hidden><span class="arcade-completion-mark" aria-hidden="true">✦</span><div><h3></h3><p></p></div></div></div>`;
    counter = content.querySelector('.arcade-moves');
    status = content.querySelector('.arcade-status');
    completion = content.querySelector('.arcade-completion');
  }
  function celebrate(title, message) {
    completion.querySelector('h3').textContent = title;
    completion.querySelector('p').textContent = message;
    completion.hidden = false;
  }

  function buildMemory() {
    gameChrome('Turn over two cards at a time. Find all six matching pairs — take as long as you like.', `<div class="arcade-memory-grid" role="group" aria-label="Twelve photo memory cards">${Array.from({ length: 12 }, (_, index) => `<button type="button" class="arcade-memory-card" data-memory-slot="${index}" aria-label="Card ${index + 1}, face down"><span class="arcade-card-inner"><span class="arcade-card-cover" aria-hidden="true"><i>✦</i><span>B</span><small>A BIRTHDAY ORIGINAL</small></span><span class="arcade-card-photo" aria-hidden="true"><img alt="" draggable="false"><span class="arcade-match-mark">✓</span></span></span></button>`).join('')}</div>`);
    boardButtons = Array.from(content.querySelectorAll('[data-memory-slot]'));
    boardButtons.forEach((button, index) => button.addEventListener('click', () => flipCard(index)));
    content.querySelector('.arcade-reset').addEventListener('click', resetMemory);
    resetMemory();
  }
  function resetMemory() {
    cancelPending();
    const pairs = photoIndices.map((photoIndex, pair) => ({ pair, photo: photo(photoIndex) }));
    memory = { deck: shuffle([...pairs, ...pairs]), flipped: [], matched: new Set(), moves: 0, locked: false };
    completion.hidden = true; updateCounter(0);
    content.querySelector('.arcade-reset').innerHTML = 'Start again <span aria-hidden="true">↻</span>';
    content.querySelector('.arcade-progress').textContent = '0 / 6 pairs';
    boardButtons.forEach((button, index) => {
      button.classList.remove('arcade-card-flipped', 'arcade-card-matched');
      button.setAttribute('aria-disabled', 'false');
      button.setAttribute('aria-label', `Card ${index + 1}, face down`);
      button.querySelector('img').src = memory.deck[index].photo.image;
    });
    say('A fresh set of moments. Choose any card to begin.');
  }
  function flipCard(index) {
    if (game !== 'memory' || !memory || memory.locked || memory.matched.has(index) || memory.flipped.includes(index)) return;
    const card = memory.deck[index];
    const button = boardButtons[index];
    button.classList.add('arcade-card-flipped');
    button.setAttribute('aria-label', `Card ${index + 1}, portrait ${card.pair + 1}, face up`);
    memory.flipped.push(index);
    if (memory.flipped.length === 1) { say(`Portrait ${card.pair + 1} revealed. Choose a second card.`); return; }
    memory.moves++; updateCounter(memory.moves);
    const [first, second] = memory.flipped;
    if (memory.deck[first].pair === memory.deck[second].pair) {
      [first, second].forEach(slot => {
        memory.matched.add(slot);
        boardButtons[slot].classList.add('arcade-card-matched');
        boardButtons[slot].setAttribute('aria-disabled', 'true');
        boardButtons[slot].setAttribute('aria-label', `Card ${slot + 1}, portrait ${card.pair + 1}, matched`);
      });
      memory.flipped = [];
      const found = memory.matched.size / 2;
      content.querySelector('.arcade-progress').textContent = `${found} / 6 pairs`;
      if (found === 6) {
        say(`All six pairs found in ${memory.moves} moves. A perfect match. Happy birthday, Bhavyaa!`);
        celebrate('A perfect match.', 'Here’s to a birthday full of little joys — and a year full of moments worth keeping.');
        content.querySelector('.arcade-reset').innerHTML = 'Play again <span aria-hidden="true">↻</span>';
      } else say(`A match! ${found} of 6 pairs found. Choose your next card.`);
      return;
    }
    memory.locked = true;
    say('Two different moments. They will turn back over — try another pair.');
    const version = session;
    mismatchTimer = window.setTimeout(() => {
      if (version !== session || game !== 'memory' || !memory) return;
      [first, second].forEach(slot => {
        boardButtons[slot].classList.remove('arcade-card-flipped');
        boardButtons[slot].setAttribute('aria-label', `Card ${slot + 1}, face down`);
      });
      memory.flipped = []; memory.locked = false; mismatchTimer = 0;
      say('Choose any two cards to try again.');
    }, 1100);
  }

  function buildPuzzle() {
    const image = photo(30);
    gameChrome('Tap any two pieces to swap them. Arrange the numbers from 1 to 9, left to right, to complete the portrait.', `<div class="arcade-puzzle-layout"><div class="arcade-puzzle-grid" role="group" aria-label="Nine portrait puzzle pieces">${Array.from({ length: 9 }, (_, index) => `<button type="button" class="arcade-puzzle-tile" data-puzzle-slot="${index}" aria-pressed="false"><span class="arcade-tile-number" aria-hidden="true"></span></button>`).join('')}</div><aside class="arcade-puzzle-aside"><p class="arcade-puzzle-mini-label">A LITTLE PICTURE,<br>A LITTLE PATIENCE.</p><p class="arcade-puzzle-help">Pick one piece.<br>Then pick its new place.</p><div class="arcade-reference" id="arcade-reference" hidden><img src="${escape(image.image)}" alt="The complete portrait to use as a puzzle reference"><span>THE WHOLE PICTURE</span></div><p class="arcade-hint-note">Need a nudge?<br>“Show a hint” reveals the original.</p></aside></div>`, true);
    boardButtons = Array.from(content.querySelectorAll('[data-puzzle-slot]'));
    boardButtons.forEach((button, index) => {
      button.style.backgroundImage = `url("${image.image.replace(/["\\\n\r]/g, '')}")`;
      button.addEventListener('click', () => selectTile(index));
    });
    hintButton = content.querySelector('.arcade-hint');
    reference = content.querySelector('.arcade-reference');
    hintButton.addEventListener('click', () => {
      reference.hidden = !reference.hidden;
      hintButton.setAttribute('aria-expanded', String(!reference.hidden));
      hintButton.textContent = reference.hidden ? 'Show a hint' : 'Hide the hint';
      say(reference.hidden ? 'Reference hidden. Keep going at your own pace.' : 'The complete portrait is now shown as a reference.');
    });
    content.querySelector('.arcade-reset').addEventListener('click', resetPuzzle);
    resetPuzzle();
  }
  function resetPuzzle() {
    cancelPending();
    const order = shuffle(Array.from({ length: 9 }, (_, index) => index));
    if (order.every((tile, index) => tile === index)) [order[0], order[1]] = [order[1], order[0]];
    puzzle = { order, selected: null, moves: 0, complete: false };
    completion.hidden = true; updateCounter(0);
    content.querySelector('.arcade-reset').innerHTML = 'Shuffle again <span aria-hidden="true">↻</span>';
    reference.hidden = true; hintButton.textContent = 'Show a hint'; hintButton.setAttribute('aria-expanded', 'false');
    drawPuzzle(); say('The portrait is shuffled. Select any two pieces to swap them.');
  }
  function drawPuzzle() {
    const correct = puzzle.order.filter((tile, index) => tile === index).length;
    content.querySelector('.arcade-progress').textContent = `${correct} / 9 in place`;
    boardButtons.forEach((button, index) => {
      const tile = puzzle.order[index];
      button.style.backgroundPosition = `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 50}%`;
      button.querySelector('.arcade-tile-number').textContent = String(tile + 1);
      button.classList.toggle('arcade-tile-selected', puzzle.selected === index);
      button.classList.toggle('arcade-tile-correct', tile === index);
      button.setAttribute('aria-pressed', String(puzzle.selected === index));
      button.setAttribute('aria-disabled', String(puzzle.complete));
      button.setAttribute('aria-label', `Tile ${tile + 1} in position ${index + 1}${puzzle.complete ? ', puzzle complete' : puzzle.selected === index ? ', selected. Choose another tile to swap' : '. Select to swap'}`);
    });
    content.querySelector('.arcade-puzzle-grid').classList.toggle('arcade-puzzle-complete', puzzle.complete);
  }
  function selectTile(index) {
    if (game !== 'puzzle' || !puzzle || puzzle.complete) return;
    if (puzzle.selected === null) {
      puzzle.selected = index; drawPuzzle();
      say(`Tile ${puzzle.order[index] + 1} selected. Choose a second piece to swap.`);
      return;
    }
    if (puzzle.selected === index) { puzzle.selected = null; drawPuzzle(); say('Selection cleared. Choose any piece.'); return; }
    const first = puzzle.selected;
    const firstNumber = puzzle.order[first] + 1, secondNumber = puzzle.order[index] + 1;
    [puzzle.order[first], puzzle.order[index]] = [puzzle.order[index], puzzle.order[first]];
    puzzle.selected = null; puzzle.moves++; updateCounter(puzzle.moves);
    puzzle.complete = puzzle.order.every((tile, position) => tile === position);
    drawPuzzle();
    if (puzzle.complete) {
      say(`Portrait complete in ${puzzle.moves} moves. Beautifully put together. Happy birthday, Bhavyaa!`);
      celebrate('Beautifully put together.', 'A little patience, a lovely picture. May the next chapter bring all the good pieces together for you.');
      content.querySelector('.arcade-reset').innerHTML = 'Play again <span aria-hidden="true">↻</span>';
    } else say(`Tiles ${firstNumber} and ${secondNumber} swapped. ${puzzle.order.filter((tile, position) => tile === position).length} of 9 pieces are in place.`);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
