/* ============================================================
   MONTHSARY — shared interaction helpers
   Plain JavaScript. Used by all three tulip concepts.
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));

  /* ——— Reveal on scroll ————————————————————————— */
  function setupReveal() {
    const items = $$('[data-reveal]');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    items.forEach((item) => observer.observe(item));

    // A jump to the bottom of the page (End key, anchor link) can move
    // elements above the viewport faster than the observer reports them.
    // Sweep those passed elements once per frame so nothing stays hidden.
    let sweepQueued = false;

    function revealPassed() {
      sweepQueued = false;
      const atBottom =
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;

      items.forEach((item) => {
        if (item.classList.contains('is-in')) return;
        const rect = item.getBoundingClientRect();
        if (rect.bottom < 0 || (atBottom && rect.top < window.innerHeight)) {
          item.classList.add('is-in');
          observer.unobserve(item);
        }
      });
    }

    function queueSweep() {
      if (sweepQueued) return;
      sweepQueued = true;
      window.requestAnimationFrame(revealPassed);
    }

    window.addEventListener('scroll', queueSweep, { passive: true });
    window.addEventListener('resize', queueSweep, { passive: true });

    // Cover a direct load that already starts deep in the page.
    queueSweep();
  }

  /* ——— Soft petal burst ————————————————————————— */
  function petalBurst(x, y, options) {
    if (reduceMotion) return;

    const opts = Object.assign(
      {
        count: 12,
        colors: ['#d9a7a0', '#e8c9c1', '#b7c4a8', '#f0dfc5'],
        distance: 90,
        size: 8,
        duration: 1100
      },
      options || {}
    );

    const burst = document.createElement('div');
    burst.className = 'petal-burst';
    burst.setAttribute('aria-hidden', 'true');
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;

    for (let i = 0; i < opts.count; i += 1) {
      const petal = document.createElement('span');
      const angle = (Math.PI * 2 * i) / opts.count + Math.random() * 0.6;
      const distance = opts.distance * (0.45 + Math.random() * 0.75);
      const duration = opts.duration * (0.65 + Math.random() * 0.65);

      petal.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      petal.style.setProperty('--dy', `${Math.sin(angle) * distance + 24}px`);
      petal.style.setProperty('--rot', `${Math.random() * 320 - 160}deg`);
      petal.style.setProperty('--size', `${opts.size * (0.6 + Math.random() * 0.8)}px`);
      petal.style.setProperty('--duration', `${duration}ms`);
      petal.style.setProperty('--petal-color', opts.colors[i % opts.colors.length]);
      petal.style.animationDelay = `${Math.random() * 90}ms`;
      burst.appendChild(petal);
    }

    document.body.appendChild(burst);
    window.setTimeout(() => burst.remove(), opts.duration * 1.4 + 250);
  }

  /* ——— Envelope / letter toggles ————————————————— */
  function setupLetterToggles() {
    $$('[data-letter-toggle]').forEach((button) => {
      const targetId = button.getAttribute('aria-controls');
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;

      // Marked sheet inside a letter piece (Garden). Concepts without the
      // marker keep their previous focus behaviour.
      const focusTarget = target.querySelector('[data-focus-target]');

      button.setAttribute('aria-expanded', target.classList.contains('is-open') ? 'true' : 'false');

      button.addEventListener('click', () => {
        const isOpen = target.classList.toggle('is-open');
        button.setAttribute('aria-expanded', String(isOpen));

        const label = button.querySelector('[data-letter-label]');
        if (label) {
          const openText = button.dataset.openText;
          const closeText = button.dataset.closeText;
          if (isOpen && closeText) label.textContent = closeText;
          if (!isOpen && openText) label.textContent = openText;
        }

        if (isOpen && focusTarget) {
          window.setTimeout(() => {
            // Skip the move if the letter was closed again while unfolding.
            if (target.classList.contains('is-open')) {
              focusTarget.focus({ preventScroll: true });
            }
          }, 450);
        }

        if (
          !isOpen &&
          focusTarget &&
          (target.contains(document.activeElement) || document.activeElement === document.body)
        ) {
          button.focus({ preventScroll: true });
        }
      });
    });
  }

  /* ——— Tulips that reveal a note ————————————————— */
  function setupSecretTulips() {
    $$('[data-secret-toggle]').forEach((button) => {
      const targetId = button.getAttribute('aria-controls');
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;

      button.setAttribute('aria-expanded', String(!target.hidden));

      button.addEventListener('click', () => {
        const willOpen = target.hidden;
        const group = button.dataset.secretGroup;

        if (willOpen && group) {
          $$(`[data-secret-toggle][data-secret-group="${group}"]`).forEach((other) => {
            if (other === button) return;
            const otherTarget = document.getElementById(other.getAttribute('aria-controls'));
            if (otherTarget) {
              otherTarget.hidden = true;
              otherTarget.classList.remove('is-open');
            }
            other.setAttribute('aria-expanded', 'false');
            // Let each concept reset the small "Close" label on a tulip that
            // was closed automatically when another one opened.
            other.dispatchEvent(new CustomEvent('monthsary:secret-close', { bubbles: true }));
          });
        }

        target.hidden = !willOpen;
        target.classList.toggle('is-open', willOpen);
        button.setAttribute('aria-expanded', String(willOpen));

        if (willOpen) {
          const rect = button.getBoundingClientRect();
          petalBurst(rect.left + rect.width / 2, rect.top + rect.height * 0.35, {
            count: 8,
            distance: 58,
            size: 5,
            duration: 850,
            colors: ['#d9a7a0', '#e8c9c1', '#b7c4a8', '#f0dfc5']
          });
        }
      });
    });
  }

  /* ——— Accessible focus trap ————————————————————— */
  function trapFocus(container, event) {
    if (event.key !== 'Tab') return;

    const focusables = $$(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ——— Live region announcement ————————————————— */
  function announce(message, element) {
    if (!element) return;
    element.textContent = '';
    window.setTimeout(() => {
      element.textContent = message;
    }, 40);
  }

  /* ——— Gentle pointer tilt ————————————————————— */
  function setupTilt(selector, options) {
    if (!finePointer.matches || reduceMotion) return;

    const opts = Object.assign({ max: 4, scale: 1.01 }, options || {});
    $$(selector).forEach((element) => {
      let frame = null;

      element.addEventListener('pointermove', (event) => {
        if (frame) return;
        frame = window.requestAnimationFrame(() => {
          const rect = element.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          element.style.transform = `perspective(900px) rotateX(${(-y * opts.max).toFixed(2)}deg) rotateY(${(x * opts.max).toFixed(2)}deg) scale(${opts.scale})`;
          frame = null;
        });
      });

      element.addEventListener('pointerleave', () => {
        element.style.transform = '';
      });
    });
  }

  /* ——— Photo lightbox ————————————————————————— */
  function setupPhotoLightbox() {
    const triggers = $$('[data-lightbox]');
    if (!triggers.length) return;

    const dialog = document.createElement('dialog');
    dialog.className = 'photo-lightbox';
    dialog.setAttribute('aria-label', 'Photo viewer');
    dialog.innerHTML = `
      <div class="photo-lightbox-bar">
        <span class="photo-lightbox-count" data-lightbox-count></span>
        <button class="photo-lightbox-close" type="button" aria-label="Close photo viewer">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div class="photo-lightbox-stage">
        <button class="photo-lightbox-arrow photo-lightbox-arrow--prev" type="button" aria-label="Previous photo">
          <span aria-hidden="true">←</span>
        </button>
        <figure class="photo-lightbox-figure">
          <img data-lightbox-image alt="">
          <figcaption data-lightbox-caption></figcaption>
        </figure>
        <button class="photo-lightbox-arrow photo-lightbox-arrow--next" type="button" aria-label="Next photo">
          <span aria-hidden="true">→</span>
        </button>
      </div>
    `;
    document.body.appendChild(dialog);

    const image = $('[data-lightbox-image]', dialog);
    const caption = $('[data-lightbox-caption]', dialog);
    const count = $('[data-lightbox-count]', dialog);
    const closeButton = $('.photo-lightbox-close', dialog);
    const prevButton = $('.photo-lightbox-arrow--prev', dialog);
    const nextButton = $('.photo-lightbox-arrow--next', dialog);

    let current = 0;
    let opener = null;

    function photoData(trigger) {
      const img = trigger.querySelector('img');
      const figure = trigger.closest('figure');
      const figcaption = figure ? figure.querySelector('figcaption') : null;
      const captionText = figcaption ? figcaption.textContent.trim() : '';

      return {
        src: img ? img.currentSrc || img.src : '',
        alt: img ? img.alt : '',
        caption: captionText
      };
    }

    function render() {
      const data = photoData(triggers[current]);
      if (!data.src) return;

      image.src = data.src;
      image.alt = data.alt;

      if (data.caption) {
        caption.textContent = data.caption;
        caption.hidden = false;
      } else {
        caption.textContent = '';
        caption.hidden = true;
      }

      count.textContent = `${current + 1} / ${triggers.length}`;

      const multiple = triggers.length > 1;
      prevButton.hidden = !multiple;
      nextButton.hidden = !multiple;
    }

    function open(index) {
      current = index;
      opener = triggers[index] || null;
      render();
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
      closeButton.focus({ preventScroll: true });
    }

    function step(amount) {
      current = (current + amount + triggers.length) % triggers.length;
      render();
    }

    triggers.forEach((trigger, index) => {
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.addEventListener('click', () => open(index));
    });

    closeButton.addEventListener('click', () => dialog.close());
    prevButton.addEventListener('click', () => step(-1));
    nextButton.addEventListener('click', () => step(1));

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', () => {
      if (opener) {
        opener.focus({ preventScroll: true });
        opener = null;
      }
    });

    dialog.addEventListener('keydown', (event) => {
      trapFocus(dialog, event);

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      }
    });
  }

  /* ——— Auto-init shared behaviours ————————————— */
  setupReveal();
  setupLetterToggles();
  setupSecretTulips();
  setupPhotoLightbox();

  window.Monthsary = {
    $,
    $$,
    reduceMotion,
    finePointer,
    setupReveal,
    petalBurst,
    setupLetterToggles,
    setupSecretTulips,
    setupPhotoLightbox,
    trapFocus,
    announce,
    setupTilt
  };
})();
