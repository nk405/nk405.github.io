const desktop = document.querySelector('#desktop');
const panels = [...document.querySelectorAll('[data-window-panel]')];
const taskItems = document.querySelector('.task-items');
let highestZIndex = 2;
let activeWindow = 'home';
const savedPositions = new WeakMap();

function getTaskButton(name) {
  return taskItems.querySelector(`[data-task-window="${name}"]`);
}

function ensureTaskButton(panel) {
  const name = panel.dataset.windowPanel;
  let button = getTaskButton(name);
  if (!button) {
    button = document.createElement('button');
    button.className = 'task-item';
    button.dataset.taskWindow = name;
    button.type = 'button';
    button.textContent = panel.querySelector('.title-bar-label').textContent.trim();
    taskItems.append(button);
  }
  return button;
}

ensureTaskButton(document.querySelector('[data-window-panel="home"]')).classList.add('active-task');

function openWindow(name) {
  const panel = document.querySelector(`[data-window-panel="${name}"]`);
  if (!panel) return;
  panels.forEach((item) => {
    if (item !== panel && !item.classList.contains('minimized')) item.classList.add('hidden');
  });
  panel.classList.remove('hidden', 'minimized');
  activeWindow = name;
  taskItems.querySelectorAll('.task-item').forEach((item) => item.classList.remove('active-task'));
  ensureTaskButton(panel).classList.add('active-task');
  panel.style.zIndex = ++highestZIndex;
  panel.querySelector('[data-window-action="close"]')?.focus();
}

function closeWindow(panel) {
  panel.classList.add('hidden');
  panel.classList.remove('minimized');
  getTaskButton(panel.dataset.windowPanel)?.remove();
  if (activeWindow === panel.dataset.windowPanel) {
    activeWindow = 'home';
    taskItems.querySelectorAll('.task-item').forEach((item) => item.classList.remove('active-task'));
  }
}

function minimizeWindow(panel) {
  panel.classList.add('hidden', 'minimized');
  getTaskButton(panel.dataset.windowPanel)?.classList.remove('active-task');
}

function toggleMaximize(panel) {
  const maximizeButton = panel.querySelector('[data-window-action="maximize"]');
  if (panel.classList.contains('maximized')) {
    panel.classList.remove('maximized');
    maximizeButton.setAttribute('aria-label', `Maximize ${panel.querySelector('.title-bar-label').textContent.trim()}`);
    const position = savedPositions.get(panel);
    if (position) {
      panel.style.position = position.position;
      panel.style.left = position.left;
      panel.style.top = position.top;
      panel.style.margin = position.margin;
    }
  } else {
    savedPositions.set(panel, {
      position: panel.style.position,
      left: panel.style.left,
      top: panel.style.top,
      margin: panel.style.margin,
    });
    panel.classList.add('maximized');
    maximizeButton.setAttribute('aria-label', `Restore ${panel.querySelector('.title-bar-label').textContent.trim()}`);
  }
  panel.style.zIndex = ++highestZIndex;
}

desktop.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-window]');
  if (trigger) {
    event.preventDefault();
    openWindow(trigger.dataset.window);
  }
  const action = event.target.closest('[data-window-action]');
  if (action) {
    const panel = action.closest('.window');
    if (action.dataset.windowAction === 'close') closeWindow(panel);
    if (action.dataset.windowAction === 'minimize') minimizeWindow(panel);
    if (action.dataset.windowAction === 'maximize') toggleMaximize(panel);
  }
});

document.querySelector('.start-button').addEventListener('click', () => openWindow(activeWindow));
taskItems.addEventListener('click', (event) => {
  const button = event.target.closest('[data-task-window]');
  if (button) openWindow(button.dataset.taskWindow);
});

document.querySelectorAll('.title-bar').forEach((titleBar) => {
  titleBar.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;

    const panel = titleBar.closest('.window');
    if (window.matchMedia('(max-width: 760px)').matches) return;
    if (panel.classList.contains('maximized')) return;

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
