const desktop = document.querySelector("#desktop");
const panels = [...document.querySelectorAll("[data-window-panel]")];
const taskItems = document.querySelector(".task-items");
const startMenu = document.querySelector(".start-menu");
const startButton = document.querySelector(".start-button");
const clockWidget = document.querySelector(".clock-widget");
const desktopClock = document.querySelector("#desktop-clock");
const desktopDate = document.querySelector("#desktop-date");
let highestZIndex = 2;
let activeWindow = "home";
const savedPositions = new WeakMap();
const openedWindows = new WeakSet([
  document.querySelector('[data-window-panel="home"]'),
]);

function getTaskButton(name) {
  return taskItems.querySelector(`[data-task-window="${name}"]`);
}

function ensureTaskButton(panel) {
  const name = panel.dataset.windowPanel;
  let button = getTaskButton(name);
  if (!button) {
    button = document.createElement("button");
    button.className = "task-item";
    button.dataset.taskWindow = name;
    button.type = "button";
    button.textContent = panel
      .querySelector(".title-bar-label")
      .textContent.trim();
    taskItems.append(button);
  }
  return button;
}

function focusWindow(panel) {
  activeWindow = panel.dataset.windowPanel;
  taskItems
    .querySelectorAll(".task-item")
    .forEach((item) => item.classList.remove("active-task"));
  ensureTaskButton(panel).classList.add("active-task");
  panel.style.zIndex = ++highestZIndex;
}

function centerWindow(panel) {
  if (window.matchMedia("(max-width: 760px)").matches) {
    panel.style.margin = "0";
    panel.style.position = "fixed";
    panel.style.left = "50%";
    panel.style.top = "50%";
    panel.style.transform = "translate(-50%, -50%)";
    return;
  }

  const maxLeft = Math.max(0, desktop.clientWidth - panel.offsetWidth);
  const maxTop = Math.max(0, desktop.clientHeight - 36 - panel.offsetHeight);
  panel.style.margin = "0";
  panel.style.position = "absolute";
  panel.style.left = `${Math.max(0, maxLeft / 2)}px`;
  panel.style.top = `${Math.max(0, maxTop / 2)}px`;
  panel.style.transform = "none";
}

const homePanel = document.querySelector('[data-window-panel="home"]');
centerWindow(homePanel);
ensureTaskButton(homePanel).classList.add("active-task");

function openWindow(name) {
  const panel = document.querySelector(`[data-window-panel="${name}"]`);
  if (!panel) return;
  const isNewWindow = !openedWindows.has(panel);
  panel.classList.remove("hidden", "minimized");
  if (isNewWindow) {
    centerWindow(panel);
    openedWindows.add(panel);
  }
  focusWindow(panel);
  panel.querySelector('[data-window-action="close"]')?.focus();
}

function closeWindow(panel) {
  panel.classList.add("hidden");
  panel.classList.remove("minimized", "maximized");
  openedWindows.delete(panel);
  getTaskButton(panel.dataset.windowPanel)?.remove();
  if (activeWindow === panel.dataset.windowPanel) {
    const nextPanel = panels
      .filter(
        (item) =>
          item !== panel &&
          !item.classList.contains("hidden") &&
          !item.classList.contains("minimized")
      )
      .sort(
        (a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0)
      )[0];
    if (nextPanel) focusWindow(nextPanel);
    else activeWindow = null;
  }
}

function minimizeWindow(panel) {
  panel.classList.add("hidden", "minimized");
  getTaskButton(panel.dataset.windowPanel)?.classList.remove("active-task");
  if (activeWindow === panel.dataset.windowPanel) {
    const nextPanel = panels
      .filter(
        (item) =>
          item !== panel &&
          !item.classList.contains("hidden") &&
          !item.classList.contains("minimized")
      )
      .sort(
        (a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0)
      )[0];
    if (nextPanel) focusWindow(nextPanel);
    else activeWindow = null;
  }
}

function toggleMaximize(panel) {
  const maximizeButton = panel.querySelector('[data-window-action="maximize"]');
  if (panel.classList.contains("maximized")) {
    panel.classList.remove("maximized");
    maximizeButton.setAttribute(
      "aria-label",
      `Maximize ${panel.querySelector(".title-bar-label").textContent.trim()}`
    );
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
    panel.classList.add("maximized");
    maximizeButton.setAttribute(
      "aria-label",
      `Restore ${panel.querySelector(".title-bar-label").textContent.trim()}`
    );
  }
  panel.style.zIndex = ++highestZIndex;
}

desktop.addEventListener("click", (event) => {
  const widgetTrigger = event.target.closest("[data-widget]");
  if (widgetTrigger) {
    if (widgetTrigger.dataset.dragged === "true") {
      delete widgetTrigger.dataset.dragged;
    } else if (
      event.detail === 2 ||
      window.matchMedia("(max-width: 760px)").matches
    ) {
      clockWidget.classList.remove("hidden");
      clockWidget.style.zIndex = ++highestZIndex;
    }
    return;
  }

  const trigger = event.target.closest("[data-window]");
  if (trigger) {
    if (trigger.classList.contains("desktop-icon")) {
      if (trigger.dataset.dragged === "true") delete trigger.dataset.dragged;
      else if (event.detail === 2) {
        startMenu.classList.add("hidden");
        startButton.setAttribute("aria-expanded", "false");
        openWindow(trigger.dataset.window);
      }
      return;
    }
    if (trigger.dataset.dragged === "true") {
      delete trigger.dataset.dragged;
      return;
    }
    event.preventDefault();
    startMenu.classList.add("hidden");
    startButton.setAttribute("aria-expanded", "false");
    openWindow(trigger.dataset.window);
  }
  const action = event.target.closest("[data-window-action]");
  if (action) {
    const panel = action.closest(".window");
    if (action.dataset.windowAction === "close") closeWindow(panel);
    if (action.dataset.windowAction === "minimize") minimizeWindow(panel);
    if (action.dataset.windowAction === "maximize") toggleMaximize(panel);
  }
});

document
  .querySelectorAll(".desktop-icon[data-window], .desktop-icon[data-widget]")
  .forEach((icon) => {
    icon.addEventListener("pointerdown", (event) => {
      if (window.matchMedia("(max-width: 760px)").matches) return;

      const desktopRect = desktop.getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();
      const offsetX = event.clientX - iconRect.left;
      const offsetY = event.clientY - iconRect.top;
      const maxX = desktopRect.width - iconRect.width;
      const maxY = desktopRect.height - iconRect.height - 36;
      let moved = false;
      let dragging = false;
      icon.setPointerCapture(event.pointerId);

      const moveIcon = (moveEvent) => {
        const x = moveEvent.clientX - desktopRect.left - offsetX;
        const y = moveEvent.clientY - desktopRect.top - offsetY;
        if (
          !dragging &&
          (Math.abs(moveEvent.clientX - event.clientX) > 3 ||
            Math.abs(moveEvent.clientY - event.clientY) > 3)
        ) {
          dragging = true;
          moved = true;
          icon.style.position = "absolute";
          icon.style.left = `${iconRect.left - desktopRect.left}px`;
          icon.style.top = `${iconRect.top - desktopRect.top}px`;
          icon.style.zIndex = "3";
          icon.classList.add("dragging");
        }
        if (!dragging) return;
        icon.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
        icon.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
      };
      const stopDragging = () => {
        if (moved) icon.dataset.dragged = "true";
        icon.removeEventListener("pointermove", moveIcon);
        icon.removeEventListener("pointerup", stopDragging);
        icon.removeEventListener("pointercancel", stopDragging);
        icon.classList.remove("dragging");
      };

      icon.addEventListener("pointermove", moveIcon);
      icon.addEventListener("pointerup", stopDragging);
      icon.addEventListener("pointercancel", stopDragging);
    });
  });

startMenu.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-window]");
  if (!trigger) return;
  event.preventDefault();
  startMenu.classList.add("hidden");
  startButton.setAttribute("aria-expanded", "false");
  openWindow(trigger.dataset.window);
});

startButton.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = !startMenu.classList.toggle("hidden");
  startButton.setAttribute("aria-expanded", String(isOpen));
});
taskItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-task-window]");
  if (!button) return;

  const panel = document.querySelector(
    `[data-window-panel="${button.dataset.taskWindow}"]`
  );
  if (!panel) return;
  if (
    activeWindow === button.dataset.taskWindow &&
    !panel.classList.contains("hidden")
  ) {
    minimizeWindow(panel);
  } else {
    openWindow(button.dataset.taskWindow);
  }
});

document.addEventListener("click", (event) => {
  if (
    !event.target.closest(".start-menu") &&
    !event.target.closest(".start-button")
  ) {
    startMenu.classList.add("hidden");
    startButton.setAttribute("aria-expanded", "false");
  }
});

document.querySelectorAll(".title-bar").forEach((titleBar) => {
  titleBar.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;

    const panel = titleBar.closest(".window");
    if (window.matchMedia("(max-width: 760px)").matches) return;
    if (panel.classList.contains("maximized")) return;

    const panelRect = panel.getBoundingClientRect();
    const desktopRect = desktop.getBoundingClientRect();
    const offsetX = event.clientX - panelRect.left;
    const offsetY = event.clientY - panelRect.top;
    const maxX = desktopRect.width - panelRect.width;
    const maxY = desktopRect.height - panelRect.height - 36;

    panel.style.margin = "0";
    panel.style.position = "absolute";
    panel.style.left = `${Math.max(0, Math.min(event.clientX - desktopRect.left - offsetX, maxX))}px`;
    panel.style.top = `${Math.max(0, Math.min(event.clientY - desktopRect.top - offsetY, maxY))}px`;
    panel.style.zIndex = ++highestZIndex;
    titleBar.setPointerCapture(event.pointerId);
    titleBar.classList.add("dragging");

    const moveWindow = (moveEvent) => {
      const x = moveEvent.clientX - desktopRect.left - offsetX;
      const y = moveEvent.clientY - desktopRect.top - offsetY;
      panel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
      panel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
    };
    const stopDragging = () => {
      titleBar.removeEventListener("pointermove", moveWindow);
      titleBar.removeEventListener("pointerup", stopDragging);
      titleBar.removeEventListener("pointercancel", stopDragging);
      titleBar.classList.remove("dragging");
    };

    titleBar.addEventListener("pointermove", moveWindow);
    titleBar.addEventListener("pointerup", stopDragging);
    titleBar.addEventListener("pointercancel", stopDragging);
  });

  titleBar.addEventListener("dblclick", (event) => {
    if (event.target.closest("button")) return;
    toggleMaximize(titleBar.closest(".window"));
  });
});

const clockTitleBar = document.querySelector(".clock-widget-titlebar");
clockTitleBar.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;

  const widgetRect = clockWidget.getBoundingClientRect();
  const desktopRect = desktop.getBoundingClientRect();
  const offsetX = event.clientX - widgetRect.left;
  const offsetY = event.clientY - widgetRect.top;
  const maxX = Math.max(0, desktopRect.width - widgetRect.width);
  const maxY = Math.max(0, desktopRect.height - widgetRect.height - 36);

  clockWidget.style.left = `${Math.max(0, Math.min(widgetRect.left - desktopRect.left, maxX))}px`;
  clockWidget.style.top = `${Math.max(0, Math.min(widgetRect.top - desktopRect.top, maxY))}px`;
  clockWidget.style.right = "auto";
  clockWidget.style.zIndex = ++highestZIndex;
  clockTitleBar.setPointerCapture(event.pointerId);
  clockTitleBar.classList.add("dragging");

  const moveWidget = (moveEvent) => {
    const x = moveEvent.clientX - desktopRect.left - offsetX;
    const y = moveEvent.clientY - desktopRect.top - offsetY;
    clockWidget.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
    clockWidget.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
  };
  const stopDragging = () => {
    clockTitleBar.removeEventListener("pointermove", moveWidget);
    clockTitleBar.removeEventListener("pointerup", stopDragging);
    clockTitleBar.removeEventListener("pointercancel", stopDragging);
    clockTitleBar.classList.remove("dragging");
  };

  clockTitleBar.addEventListener("pointermove", moveWidget);
  clockTitleBar.addEventListener("pointerup", stopDragging);
  clockTitleBar.addEventListener("pointercancel", stopDragging);
});

panels.forEach((panel) => {
  panel.addEventListener("pointerdown", () => {
    if (
      !panel.classList.contains("hidden") &&
      !panel.classList.contains("minimized")
    )
      focusWindow(panel);
  });
});

function updateClock() {
  const now = new Date();
  const time = new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
  const date = new Intl.DateTimeFormat([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);
  document.querySelector("#clock").textContent = time;
  desktopClock.textContent = time;
  desktopClock.dateTime = now.toISOString();
  desktopDate.textContent = date;
}
updateClock();
setInterval(updateClock, 30000);

document.querySelector(".clock-widget-close").addEventListener("click", () => {
  clockWidget.classList.add("hidden");
});

const minesweeperBoard = document.querySelector("[data-minesweeper-board]");
const minesweeperReset = document.querySelector("[data-minesweeper-reset]");
const minesweeperMineCount = document.querySelector("[data-minesweeper-mines]");
const minesweeperTime = document.querySelector("[data-minesweeper-time]");
const mineRows = 9;
const mineColumns = 9;
const mineTotal = 10;
let mineCells = [];
let mineGameOver = false;
let mineStarted = false;
let mineElapsed = 0;
let mineTimer;

function formatMineTime(value) {
  return String(Math.min(999, value)).padStart(3, "0");
}

function formatMineCount(value) {
  return String(Math.max(0, value)).padStart(3, "0");
}

function getMineNeighbors(index) {
  const row = Math.floor(index / mineColumns);
  const column = index % mineColumns;
  const neighbors = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (!rowOffset && !columnOffset) continue;
      const neighborRow = row + rowOffset;
      const neighborColumn = column + columnOffset;
      if (
        neighborRow >= 0 &&
        neighborRow < mineRows &&
        neighborColumn >= 0 &&
        neighborColumn < mineColumns
      ) {
        neighbors.push(neighborRow * mineColumns + neighborColumn);
      }
    }
  }
  return neighbors;
}

function finishMinesweeper(message) {
  mineGameOver = true;
  clearInterval(mineTimer);
  const won = message.startsWith("You cleared");
  minesweeperReset.classList.toggle("face-lost", !won);
  minesweeperReset.classList.toggle("face-won", won);
  if (won) {
    mineCells.forEach((cell) => {
      if (cell.mine && !cell.flagged) {
        cell.flagged = true;
        cell.button.classList.add("flagged");
        cell.button.textContent = "⚑";
      }
    });
    minesweeperMineCount.textContent = formatMineCount(0);
  }
  minesweeperBoard.setAttribute("aria-label", `Minesweeper board: ${message}`);
  mineCells.forEach((cell) => {
    if (cell.mine) {
      cell.button.classList.add("revealed", "mine");
      cell.button.textContent = "✹";
    }
  });
  minesweeperBoard
    .closest(".window")
    .querySelector(".minesweeper-help").textContent = message;
}

function revealMineCell(index) {
  const cell = mineCells[index];
  if (!cell || mineGameOver || cell.revealed || cell.flagged) return;

  if (!mineStarted) {
    mineStarted = true;
    mineTimer = setInterval(() => {
      mineElapsed = Math.min(999, mineElapsed + 1);
      minesweeperTime.textContent = formatMineTime(mineElapsed);
      if (mineElapsed === 999) clearInterval(mineTimer);
    }, 1000);
  }

  cell.revealed = true;
  cell.button.classList.add("revealed");
  cell.button.setAttribute(
    "aria-label",
    cell.mine ? "Mine" : `${cell.neighborMines} adjacent mines`
  );
  if (cell.mine) {
    cell.button.textContent = "✹";
    finishMinesweeper("Boom! Try a new game.");
    return;
  }

  if (cell.neighborMines > 0) {
    cell.button.dataset.number = cell.neighborMines;
    cell.button.textContent = cell.neighborMines;
  } else {
    getMineNeighbors(index).forEach(revealMineCell);
  }

  if (mineCells.every((mineCell) => mineCell.mine || mineCell.revealed)) {
    finishMinesweeper("You cleared the field!");
  }
}

function toggleMineFlag(index) {
  const cell = mineCells[index];
  if (!cell || mineGameOver || cell.revealed) return;
  const flags = mineCells.filter((mineCell) => mineCell.flagged).length;
  if (!cell.flagged && flags >= mineTotal) return;
  cell.flagged = !cell.flagged;
  cell.button.classList.toggle("flagged", cell.flagged);
  cell.button.textContent = cell.flagged ? "⚑" : "";
  cell.button.setAttribute(
    "aria-label",
    cell.flagged ? "Flagged square" : "Covered square"
  );
  const updatedFlags = mineCells.filter((mineCell) => mineCell.flagged).length;
  minesweeperMineCount.textContent = formatMineCount(mineTotal - updatedFlags);
}

function createMinesweeper() {
  clearInterval(mineTimer);
  mineGameOver = false;
  mineStarted = false;
  mineElapsed = 0;
  minesweeperTime.textContent = formatMineTime(mineElapsed);
  minesweeperMineCount.textContent = formatMineCount(mineTotal);
  minesweeperReset.classList.remove("face-lost", "face-won");
  minesweeperBoard.setAttribute("aria-label", "Minesweeper board");
  minesweeperBoard
    .closest(".window")
    .querySelector(".minesweeper-help").textContent =
    "Left-click to reveal. Right-click to flag a square.";
  minesweeperBoard.replaceChildren();
  const mineIndexes = new Set();
  while (mineIndexes.size < mineTotal)
    mineIndexes.add(Math.floor(Math.random() * mineRows * mineColumns));
  mineCells = Array.from({ length: mineRows * mineColumns }, (_, index) => ({
    mine: mineIndexes.has(index),
    neighborMines: 0,
    revealed: false,
    flagged: false,
    button: null,
  }));
  mineCells.forEach((cell, index) => {
    cell.neighborMines = getMineNeighbors(index).filter(
      (neighbor) => mineCells[neighbor].mine
    ).length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mine-cell";
    button.dataset.mineIndex = index;
    button.setAttribute("role", "gridcell");
    button.setAttribute("aria-label", "Covered square");
    cell.button = button;
    minesweeperBoard.append(button);
  });
}

minesweeperBoard.addEventListener("click", (event) => {
  const cell = event.target.closest("[data-mine-index]");
  if (cell) revealMineCell(Number(cell.dataset.mineIndex));
});
minesweeperBoard.addEventListener("contextmenu", (event) => {
  const cell = event.target.closest("[data-mine-index]");
  if (!cell) return;
  event.preventDefault();
  toggleMineFlag(Number(cell.dataset.mineIndex));
});
minesweeperReset.addEventListener("click", createMinesweeper);
createMinesweeper();
