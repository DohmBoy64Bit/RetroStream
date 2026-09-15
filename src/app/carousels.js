/** Native scrolling with accessible paging and desktop pointer dragging. */
export function installCarousels(root) {
  const rows = new Map();
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let sequence = 0;
  let scheduled = false;
  const resize = new ResizeObserver(entries => entries.forEach(({target}) => rows.get(target)?.update()));

  function enhance(row) {
    const label = row.getAttribute('aria-label') ||
      row.previousElementSibling?.querySelector('h2')?.textContent ||
      row.closest('.section')?.querySelector('h2')?.textContent || 'Browse collection';
    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-shell' + (row.classList.contains('shelf') ? ' carousel-posters' : ' carousel-compact');
    row.before(wrapper);
    wrapper.append(row);
    row.id ||= `carousel-${++sequence}`;
    row.tabIndex = -1;
    row.setAttribute('role', 'region');
    row.setAttribute('aria-label', label);
    row.classList.add('carousel-track');
    const controls = [-1, 1].map(direction => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `carousel-arrow ${direction < 0 ? 'carousel-prev' : 'carousel-next'}`;
      button.setAttribute('aria-label', `${direction < 0 ? 'Previous' : 'Next'} items: ${label}`);
      button.setAttribute('aria-controls', row.id);
      button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${direction < 0 ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'}"/></svg>`;
      button.addEventListener('click', () => page(direction));
      wrapper.append(button);
      return button;
    });
    function page(direction) {
      row.scrollBy({left: direction * row.clientWidth * .9, behavior: reducedMotion() ? 'instant' : 'smooth'});
    }
    function update() {
      const max = row.scrollWidth - row.clientWidth;
      controls[0].disabled = max <= 2 || row.scrollLeft <= 2;
      controls[1].disabled = max <= 2 || row.scrollLeft >= max - 2;
      wrapper.classList.toggle('carousel-overflows', max > 2);
    }
    let pointer = null;
    let dragged = false;
    let suppressClickUntil = 0;
    let rafId = null;
    row.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || row.scrollWidth <= row.clientWidth) return;
      pointer = {id: event.pointerId, x: event.clientX, left: row.scrollLeft};
      dragged = false;
      suppressClickUntil = 0;
      rafId = null;
    });
    row.addEventListener('pointermove', event => {
      if (!pointer || event.pointerId !== pointer.id) return;
      const delta = event.clientX - pointer.x;
      if (!dragged && Math.abs(delta) < 6) return;
      if (!dragged) {
        dragged = true;
        row.setPointerCapture(pointer.id);
        row.classList.add('carousel-dragging');
      }
      event.preventDefault();
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        row.scrollLeft = pointer.left - delta;
        rafId = null;
      });
    });
    function finish(event) {
      if (!pointer || event.pointerId !== pointer.id) return;
      if (dragged) suppressClickUntil = performance.now() + 350;
      if (row.hasPointerCapture(pointer.id)) row.releasePointerCapture(pointer.id);
      pointer = null;
      dragged = false;
      rafId = null;
      row.classList.remove('carousel-dragging');
      update();
    }
    row.addEventListener('pointerup', finish);
    row.addEventListener('pointercancel', finish);
    row.addEventListener('lostpointercapture', finish);
    row.addEventListener('pointerleave', event => { if (!dragged) finish(event); });
    row.addEventListener('dragstart', event => event.preventDefault());
    row.addEventListener('click', event => {
      if (event.detail !== 0 && performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    row.addEventListener('keydown', event => {
      if (event.target !== row) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        page(event.key === 'ArrowRight' ? 1 : -1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        row.scrollTo({left: event.key === 'Home' ? 0 : row.scrollWidth, behavior: reducedMotion() ? 'instant' : 'smooth'});
      }
    });
    row.addEventListener('scroll', update, {passive: true});
    rows.set(row, {update});
    resize.observe(row);
    update();
  }
  function sync() {
    scheduled = false;
    for (const row of rows.keys()) {
      if (!root.contains(row)) { resize.unobserve(row); rows.delete(row); }
    }
    root.querySelectorAll('.shelf, .genre-strip, .cast').forEach(row => {
      if (!rows.has(row)) enhance(row);
      else rows.get(row).update();
    });
  }
  const observer = new MutationObserver(() => {
    if (!scheduled) { scheduled = true; queueMicrotask(sync); }
  });
  observer.observe(root, {childList: true, subtree: true});
  sync();
  return () => { observer.disconnect(); resize.disconnect(); rows.clear(); };
}
