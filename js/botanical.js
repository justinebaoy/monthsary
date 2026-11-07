/* ============================================================
   CONCEPT A — TULIP ATELIER
   The large tulip blooms when touched. No personal content here.
   ============================================================ */
(function () {
  'use strict';

  const M = window.Monthsary;
  if (!M) return;

  const { $ } = M;

  /* ——— The click-to-bloom tulip ————————————————— */
  const bloom = $('#a-bloom');
  const bloomLabel = $('[data-bloom-label]');

  if (bloom) {
    bloom.addEventListener('click', () => {
      const isOpen = bloom.classList.toggle('is-bloomed');
      bloom.setAttribute('aria-expanded', String(isOpen));

      if (bloomLabel) {
        bloomLabel.textContent = isOpen ? 'Press to rest' : 'Touch to bloom';
      }

      if (isOpen && !M.reduceMotion) {
        const rect = bloom.getBoundingClientRect();
        M.petalBurst(rect.left + rect.width / 2, rect.top + rect.height * 0.4, {
          count: 16,
          distance: 110,
          size: 7,
          duration: 1200,
          colors: ['#d9a39c', '#edc8c1', '#b7c4a8', '#f0dfc5']
        });
      }
    });
  }

  /* ——— A soft sway for the small secret tulips ——— */
  // The sway itself is pure CSS; nothing personal is added by this script.
})();
