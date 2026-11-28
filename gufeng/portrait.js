const controls = document.querySelector('#angle-buttons');
const portrait = document.querySelector('#portrait');

controls.addEventListener('click', event => {
  const next = event.target.closest('button[data-frame]');
  if (!next) return;
  portrait.src = `images/${next.dataset.frame}.webp`;
  portrait.alt = next.dataset.alt;
  for (const button of controls.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button === next));
  }
});
