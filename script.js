const desktop = document.querySelector('#desktop');
const panels = [...document.querySelectorAll('[data-window-panel]')];
const taskButton = document.querySelector('.task-item');
let highestZIndex = 2;

function openWindow(name) {
  const panel = document.querySelector(`[data-window-panel="${name}"]`);
  if (!panel) return;
  panels.forEach((item) => item.classList.toggle('hidden', item !== panel));
  taskButton.classList.toggle('active-task', name === 'home');
  panel.style.zIndex = ++highestZIndex;
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

document.querySelectorAll('.title-bar').forEach((titleBar) => {
  titleBar.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;

    const panel = titleBar.closest('.window');
    if (window.matchMedia('(max-width: 760px)').matches) return;

    const panelRect = panel.getBoundingClientRect();
    const desktopRect = desktop.getBoundingClientRect();
    const offsetX = event.clientX - panelRect.left;
    const offsetY = event.clientY - panelRect.top;
    const maxX = desktopRect.width - panelRect.width;
    const maxY = desktopRect.height - panelRect.height - 36;

    panel.style.margin = '0';
    panel.style.position = 'absolute';
    panel.style.left = `${Math.max(0, Math.min(event.clientX - desktopRect.left - offsetX, maxX))}px`;
    panel.style.top = `${Math.max(0, Math.min(event.clientY - desktopRect.top - offsetY, maxY))}px`;
    panel.style.zIndex = ++highestZIndex;
    titleBar.setPointerCapture(event.pointerId);
    titleBar.classList.add('dragging');

    const moveWindow = (moveEvent) => {
      const x = moveEvent.clientX - desktopRect.left - offsetX;
      const y = moveEvent.clientY - desktopRect.top - offsetY;
      panel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
      panel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
    };
    const stopDragging = () => {
      titleBar.removeEventListener('pointermove', moveWindow);
      titleBar.removeEventListener('pointerup', stopDragging);
      titleBar.removeEventListener('pointercancel', stopDragging);
      titleBar.classList.remove('dragging');
    };

    titleBar.addEventListener('pointermove', moveWindow);
    titleBar.addEventListener('pointerup', stopDragging);
    titleBar.addEventListener('pointercancel', stopDragging);
  });
});

function updateClock() {
  document.querySelector('#clock').textContent = new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}
updateClock();
setInterval(updateClock, 30000);
