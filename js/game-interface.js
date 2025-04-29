const maxCellSize = 48;
const minCellSize = 12;

let cellSize;

export function renderGame(grid, player, score, level, health, start) {
  const container = document.getElementById('game');

  const width = grid.map[0].length;
  const height = grid.map.length;

  if (start) {
    cellSize = Math.max(minCellSize, Math.min(maxCellSize, Math.floor(window.innerWidth / width)));

    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
    container.style.gridTemplateRows = `repeat(${height}, ${cellSize}px)`;
    container.style.width = `${width * cellSize}px`;
    container.style.height = `${height * cellSize}px`;
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
    player.div = document.createElement('div');
    player.div.className = 'unit player';
    player.div.style.width = `${cellSize}px`;
    player.div.style.height = `${cellSize}px`;
    container.appendChild(player.div);
  }
  player.div.style.transform = `translate(${player.x * cellSize}px, ${player.y * cellSize}px)`;

  grid.units.forEach(unit => {
    if (unit.div === null) {
      unit.div = document.createElement('div');
      unit.div.className = 'unit enemy ' + unit.behavior;
      unit.div.style.width = `${cellSize}px`;
      unit.div.style.height = `${cellSize}px`;
      unit.div.style.transition = 'transform 0.2s ease';
      container.appendChild(unit.div);
    }

    unit.div.style.transform = `translate(${unit.x * cellSize}px, ${unit.y * cellSize}px)`;
  });

  const info = document.getElementById('info');
  info.innerText = `Уровень: ${level} | Очки: ${score} | Здоровье: ${health}`;

  const bar = document.getElementById('reveal-bar');
  const text = document.getElementById('reveal-text');
  bar.style.background = `background: linear-gradient(to right, #00ff00, #ffff00, #ff0000);`
  bar.style.width = `${Math.floor(player.detectedRate)}%`;
  let detectedRate = player.detectedRate >= 100 ? 100 : Math.floor(player.detectedRate);
  text.textContent = `Вас раскрыли на ${detectedRate}%`;

  centerCameraOnPlayer(player);
}

function centerCameraOnPlayer(player) {
  if (player.div) {
    player.div.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}

