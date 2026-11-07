/* ============================================================
   CONCEPT B — TULIP GARDEN
   Small extras on top of the shared interactions:
   an opened note scrolls into view, its label flips to "Close",
   and the accessible names stay in step with the visible labels.
   ============================================================ */
(function () {
  'use strict';

  const M = window.Monthsary;
  if (!M) return;

  const { $, $$ } = M;

  function setLabel(button, opened) {
    const label = button.querySelector('.b-bed-open');
    if (label) {
      const textNode = Array.from(label.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
      );
      if (textNode) textNode.textContent = opened ? 'Close ' : 'Open ';
    }

    const name = button.querySelector('.b-bed-name');
    if (name) {
      const who = name.textContent.trim().toLowerCase();
      button.setAttribute(
        'aria-label',
        `${opened ? 'Close' : 'Open'} the note in ${who}`
      );
    }
  }

  $$('[data-secret-toggle][data-secret-group="garden"]').forEach((button) => {
    const targetId = button.getAttribute('aria-controls');
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    button.addEventListener('click', () => {
      const opened = !target.hidden;

      setLabel(button, opened);

      if (opened) {
        window.setTimeout(() => {
          target.scrollIntoView({
            behavior: M.reduceMotion ? 'auto' : 'smooth',
            block: 'nearest'
          });
        }, 160);
      }
    });

    // Another tulip in the bed opened, so this one was closed for us.
    button.addEventListener('monthsary:secret-close', () => setLabel(button, false));
  });

  /* Keep the envelope's accessible name in step with its visible label. */
  const envelope = $('[data-letter-toggle]');

  if (envelope) {
    const syncEnvelopeName = () => {
      const open = envelope.getAttribute('aria-expanded') === 'true';
      envelope.setAttribute('aria-label', open ? 'Close the letter' : 'Open the letter');
    };

    envelope.addEventListener('click', () => {
      window.requestAnimationFrame(syncEnvelopeName);
    });

    syncEnvelopeName();
  }
})();
