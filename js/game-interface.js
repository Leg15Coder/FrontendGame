import { chooseTrojanSkin } from './behaviors.js';

const maxCellSize = 48;
const minCellSize = 12;

let cellSize;

export function renderGame(grid, player, score, level, start) {
  const container = document.getElementById('game');
  const width = grid.map[0].length;
  const height = grid.map.length;

  if (start) {
    resizeContainerAndCell(container, width, height);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid.map[y][x].div === undefined || grid.map[y][x].div === null) {
        grid.map[y][x].div = document.createElement('div');
        container.appendChild(grid.map[y][x].div);
      }

      grid.map[y][x].div.className = 'cell ' + grid.map[y][x].type;
    }
  }

  if (player.div === undefined || player.div === null) {
    createHTMLObjectForUnit(player, 'player');
    container.appendChild(player.div);
  }
  player.div.style.transform = `translate(${player.x * cellSize}px, ${player.y * cellSize}px)`;

  grid.units.forEach(unit => {
    if (unit.div === undefined || unit.div === null) {
      createHTMLObjectForUnit(unit, 'enemy');
      container.appendChild(unit.div);
    }

    unit.div.style.transform = `translate(${unit.x * cellSize}px, ${unit.y * cellSize}px)`;
  });

  updateAndDisplayInfo(level, score, player);
  centerCameraOnPlayer(player);
}

function createHTMLObjectForUnit(unit, type) {
  unit.div = document.createElement('div');
  unit.div.className = `unit ${type}`;

  if (unit.behavior) {
    unit.div.className += ' ' + unit.behavior;
    if (unit.behavior === 'trojan') {
      unit.div.className += ' ' + chooseTrojanSkin();
    }
  }

  unit.div.style.width = `${cellSize}px`;
  unit.div.style.height = `${cellSize}px`;
  unit.div.style.transition = 'transform 0.2s ease';
}

function resizeContainerAndCell(container, width, height) {
  cellSize = Math.max(minCellSize, Math.min(maxCellSize, Math.floor(window.innerWidth / width)));
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
  container.style.gridTemplateRows = `repeat(${height}, ${cellSize}px)`;
  container.style.width = `${width * cellSize}px`;
  container.style.height = `${height * cellSize}px`;
}

function updateAndDisplayInfo(level, score, player) {
  const info = document.getElementById('info');
  info.innerText = `${level} Lvl | ${score} 💰 | ${player.health} ❤️`;

  const bar = document.getElementById('reveal-bar');
  const text = document.getElementById('reveal-text');
  bar.style.background = `background: linear-gradient(to right, #00ff00, #ffff00, #ff0000);`
  bar.style.width = `${Math.floor(player.detectedRate)}%`;
  let detectedRate = player.detectedRate >= 100 ? 100 : Math.floor(player.detectedRate);
  text.textContent = `Вас раскрыли на ${detectedRate}%`;
}

function centerCameraOnPlayer(player) {
  if (player.div) {
    player.div.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}
