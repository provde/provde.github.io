'use strict';

// Prepared examples for the Product walkthrough. No uploaded inputs or network calls.
const EXAMPLES = Object.freeze({
  condition: {
    source: 'Refunds are available within 30 days <mark>when a receipt is provided.</mark>',
    edit: 'Refunds are available within 30 days.',
    sourceLabel: 'Refund policy',
    editLabel: 'Summary',
    reason: 'The receipt requirement is missing.',
    explanation: 'The summary could make the policy sound like it applies without a receipt. The original includes that condition.',
    faithful: 'With a receipt, refunds are available within 30 days.',
    faithfulReason: 'The time limit and the receipt condition are both kept.',
    faithfulExplanation: 'This alternative keeps the time limit and the receipt requirement from the source.'
  },
  scope: {
    source: 'The improvement was observed <mark>in a small trial.</mark>',
    edit: 'The approach <mark class="changed">improves performance.</mark>',
    sourceLabel: 'Research note',
    editLabel: 'Report summary',
    reason: 'A limited observation became a general claim.',
    explanation: 'The original describes what happened in a small trial. The summary no longer includes that limit.',
    faithful: 'A small trial showed an improvement with this approach.',
    faithfulReason: 'The finding stays tied to the small trial.',
    faithfulExplanation: 'The finding stays tied to the setting in which the improvement was observed.'
  },
  intent: {
    source: 'We <mark>recommend offering</mark> the customer an extension.',
    edit: 'We <mark class="changed">will offer</mark> the customer an extension.',
    sourceLabel: 'Meeting notes',
    editLabel: 'Team handoff',
    reason: 'A recommendation became a commitment.',
    explanation: 'The meeting notes suggest an option to consider. The handoff reads as a decision that has already been made.',
    faithful: 'The team recommends offering the customer an extension.',
    faithfulReason: 'The recommendation stays a recommendation.',
    faithfulExplanation: 'The next person can see that the extension is suggested, and the decision is still open.'
  }
});

const menu = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');
function closeMenu() {
  menu?.setAttribute('aria-expanded', 'false');
  nav?.classList.remove('is-open');
}
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menu.focus();
  }
});
nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
window.matchMedia('(min-width: 721px)').addEventListener('change', closeMenu);

const walkthrough = document.querySelector('[data-walkthrough]');
if (walkthrough) {
  let selected = 'condition';
  let faithful = false;
  const tabs = [...walkthrough.querySelectorAll('[data-example]')];
  const panel = document.getElementById('example-panel');
  const toggle = document.getElementById('faithful-toggle');
  function renderExample() {
    const example = EXAMPLES[selected];
    panel.classList.remove('is-swapping');
    void panel.offsetWidth;
    panel.classList.add('is-swapping');
    document.getElementById('example-source').innerHTML = example.source;
    const edit = document.getElementById('example-edit');
    if (faithful) edit.textContent = example.faithful;
    else edit.innerHTML = example.edit;
    for (const [id, value] of Object.entries({
      'example-source-label': example.sourceLabel,
      'example-edit-label': faithful ? 'Faithful alternative' : example.editLabel,
      'example-reason-label': faithful ? 'What this alternative keeps' : 'What needs attention',
      'example-reason': faithful ? example.faithfulReason : example.reason,
      'example-explanation': faithful ? example.faithfulExplanation : example.explanation,
      'example-state': faithful ? 'Details kept' : 'Needs attention'
    })) document.getElementById(id).textContent = value;
    const state = document.getElementById('example-state');
    state.classList.toggle('is-matched', faithful);
    walkthrough.querySelector('.review-outcome').classList.toggle('is-matched', faithful);
    walkthrough.querySelector('.outcome-icon').textContent = faithful ? '✓' : '!';
    toggle.setAttribute('aria-pressed', String(faithful));
    toggle.replaceChildren(document.createTextNode(faithful ? 'Back to the changed edit ' : 'Show a faithful edit '));
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    toggle.append(arrow);
    for (const tab of tabs) {
      const active = tab.dataset.example === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', 'tab-' + selected);
  }
  for (const tab of tabs) {
    tab.addEventListener('click', () => { selected = tab.dataset.example; faithful = false; renderExample(); });
    tab.addEventListener('keydown', event => {
      let index = tabs.indexOf(tab);
      if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') index = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else return;
      event.preventDefault();
      tabs[index].click();
      tabs[index].focus();
    });
  }
  toggle.addEventListener('click', () => { faithful = !faithful; renderExample(); });
}

const form = document.querySelector('[data-contact-form]');
if (form) {
  // The endpoint comes from CONTACT_ENDPOINT in build.py (data-endpoint on the form).
  const status = form.querySelector('[data-contact-status]');
  const submit = form.querySelector('[type="submit"]');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      status.textContent = 'Sending is not connected yet.';
      return;
    }
    submit.disabled = true;
    status.textContent = 'Sending…';
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      form.reset();
      status.textContent = 'Thanks. Your message has been sent.';
    } catch {
      status.textContent = 'Something went wrong. Please try again.';
    } finally {
      submit.disabled = false;
    }
  });
}

// Header depth once the page scrolls.
const header = document.querySelector('.site-header');
const markScrolled = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
markScrolled();
window.addEventListener('scroll', markScrolled, { passive: true });

// Reveal sections as they scroll into view. Content on the first screen is left
// alone, and nothing moves for visitors who prefer reduced motion.
const prefersCalm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersCalm && 'IntersectionObserver' in window) {
  const selector = [
    '.section-intro', '.intro-copy', '.section-heading', '.value-columns article',
    '.use-case-teaser > div:first-child', '.workflow-list a', '.statement-section > *',
    '.queue2 .shot', '.numbered-list li', '.statement2 .container > *', '.figs-head', '.fig',
    '.split-head', '.queue2 .stage', '.continuity > div', '.availability-list > div',
    '.faq-section > div:first-child', '.faq-list details', '.use-case-copy', '.example-card',
    '.walkthrough', '.split > div', '.footer-cta > div'
  ].join(',');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  const fold = window.innerHeight * 0.9;
  const order = new Map();
  for (const element of document.querySelectorAll(selector)) {
    if (element.getBoundingClientRect().top < fold) continue;
    const index = order.get(element.parentElement) ?? 0;
    order.set(element.parentElement, index + 1);
    element.style.setProperty('--reveal-delay', Math.min(index, 4) * 90 + 'ms');
    element.classList.add('reveal');
    observer.observe(element);
  }
}
