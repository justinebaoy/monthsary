/* ============================================================
   CONCEPT C — TULIP SCRAPBOOK
   Small extras on top of the shared interactions:
   the pocket knows when a note is tucked inside, and the
   tulip label flips between open and close.
   ============================================================ */
(function () {
  'use strict';

  const M = window.Monthsary;
  if (!M) return;

  const { $, $$ } = M;
  const stage = $('.c-pocket-stage');

  function syncPocket() {
    if (!stage) return;
    const hasNote = !!stage.querySelector('.c-pocket-note:not([hidden])');
    stage.classList.toggle('has-note', hasNote);
  }

  function setLabel(button, opened) {
    const label = button.querySelector('.c-pressed-open');
    if (!label) return;

    const textNode = Array.from(label.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );
    if (textNode) textNode.textContent = opened ? 'Close the note ' : 'Open the note ';
  }

  $$('[data-secret-toggle][data-secret-group="scrapbook"]').forEach((button) => {
    const targetId = button.getAttribute('aria-controls');
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    button.addEventListener('click', () => {
      const opened = !target.hidden;

      setLabel(button, opened);
      syncPocket();

      if (opened) {
        window.setTimeout(() => {
          target.scrollIntoView({
            behavior: M.reduceMotion ? 'auto' : 'smooth',
            block: 'nearest'
          });
        }, 160);
      }
    });

    // Another pressed tulip opened, so this one was closed for us.
    button.addEventListener('monthsary:secret-close', () => {
      setLabel(button, false);
      syncPocket();
    });
  });

  syncPocket();
})();
