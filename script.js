const desktop = document.querySelector('#desktop');
const panels = [...document.querySelectorAll('[data-window-panel]')];
const taskButton = document.querySelector('.task-item');

function openWindow(name) {
  const panel = document.querySelector(`[data-window-panel="${name}"]`);
  if (!panel) return;
  panels.forEach((item) => item.classList.toggle('hidden', item !== panel));
  taskButton.classList.toggle('active-task', name === 'home');
  if (name !== 'home') panel.querySelector('.close-button')?.focus();
}

desktop.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-window]');
  if (trigger) {
    event.preventDefault();
    openWindow(trigger.dataset.window);
  }
  const close = event.target.closest('[data-close]');
  if (close) {
    openWindow('home');
  }
});

document.querySelector('.start-button').addEventListener('click', () => openWindow('home'));

function updateClock() {
  document.querySelector('#clock').textContent = new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}
updateClock();
setInterval(updateClock, 30000);
