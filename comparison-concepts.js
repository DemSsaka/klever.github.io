(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const activeAnimations = new Set();
  const initialized = new WeakSet();
  function reveal(element, keyboard = false) {
    if (reduced.matches || keyboard || !element.animate) return;
    for (const animation of element.getAnimations()) animation.cancel();
    const animation = element.animate([{opacity: .35, transform: 'translateY(7px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 230, easing: 'cubic-bezier(.22,1,.36,1)'});
    activeAnimations.add(animation);
    animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
  }
  reduced.addEventListener('change', () => { if (reduced.matches) for (const animation of activeAnimations) animation.cancel(); });

  function init(section) {
    if (initialized.has(section)) return;
    initialized.add(section);
    section.dataset.ccReady = 'true';
    const tabs = [...section.querySelectorAll('[data-criterion]')];
    const panels = [...section.querySelectorAll('.cc-criterion-panel')];
    // DC's React renderer can treat an empty boolean attribute as false.
    // Reconcile initial panel visibility on every newly mounted DOM section.
    const current = Math.max(0, tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true'));
    panels.forEach((panel, index) => {panel.hidden = index !== current;});
    function select(index, keyboard) {
      if (tabs[index].getAttribute('aria-selected') === 'true') return;
      tabs.forEach((tab, i) => {tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index;});
      reveal(panels[index], keyboard);
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', event => select(index, event.detail === 0));
      tab.addEventListener('keydown', event => {
        let next;
        if (['ArrowDown', 'ArrowRight'].includes(event.key)) next = (index + 1) % tabs.length;
        if (['ArrowUp', 'ArrowLeft'].includes(event.key)) next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault(); select(next, true); tabs[next].focus();
      });
    });
    section.querySelectorAll('.cc-detail').forEach(detail => {
      let keyboard = false;
      detail.querySelector('summary').addEventListener('click', event => {keyboard = event.detail === 0;});
      detail.addEventListener('toggle', () => {if (detail.open) reveal(detail.querySelector('.cc-detail-body'), keyboard);});
    });
  }
  function boot() {document.querySelectorAll('[data-comparison-mode]').forEach(init);}
  boot();
  // The existing DC runtime replaces its initial markup once React mounts.
  let queued = false;
  new MutationObserver(() => {if (!queued) {queued = true; requestAnimationFrame(() => {queued = false; boot();});}}).observe(document.documentElement, {childList: true, subtree: true});

  const choices = [...document.querySelectorAll('[data-design]')];
  if (!choices.length) return;
  const descriptions = JSON.parse(document.getElementById('cc-descriptions').textContent);
  function choose(index, keyboard = false) {
    choices.forEach(button => button.setAttribute('aria-pressed', String(+button.dataset.design === index)));
    document.querySelectorAll('[data-review-panel]').forEach(panel => {panel.hidden = +panel.dataset.reviewPanel !== index;});
    document.getElementById('cc-design-description').textContent = descriptions[index - 1];
    document.getElementById('cc-context-link').href = `comparison-option-${index}.html#comparison`;
    history.replaceState(null, '', `#variant-${index}`);
    reveal(document.querySelector(`[data-review-panel="${index}"] .cc-inner`), keyboard);
  }
  choices.forEach(button => button.addEventListener('click', event => choose(+button.dataset.design, event.detail === 0)));
  const initial = Number(location.hash.match(/^#variant-([1-4])$/)?.[1]);
  if (initial) choose(initial, true);
})();
