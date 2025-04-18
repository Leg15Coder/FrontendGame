const maxCellSize = 48;
const minCellSize = 12;

let cellSize;

export function renderGame(grid, player, score, level, health) {
  const container = document.getElementById('game');
  container.innerHTML = '';

  const width = grid.map[0].length;
  const height = grid.map.length;

  const maxContainerWidth = window.innerWidth - 40;
  cellSize = Math.max(minCellSize, Math.min(maxCellSize, Math.floor(maxContainerWidth / width)));

  container.style.gridTemplateColumns = `repeat(${width}, ${cellSize}px)`;
  container.style.gridTemplateRows = `repeat(${height}, ${cellSize}px)`;
  container.style.width = `${width * cellSize}px`;
  container.style.height = `${height * cellSize}px`;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cellDiv = document.createElement('div');
      cellDiv.className = 'cell ' + grid.map[y][x].type;
      container.appendChild(cellDiv);
    }
  }

  player.div = document.createElement('div');
  player.div.className = 'unit player';
  player.div.style.width = `${cellSize}px`;
  player.div.style.height = `${cellSize}px`;
  container.appendChild(player.div);

  grid.units = grid.units.map(unit => {
    const enemyDiv = document.createElement('div');
    enemyDiv.style.width = `${cellSize}px`;
    enemyDiv.style.height = `${cellSize}px`;
    enemyDiv.className = 'unit enemy';
    enemyDiv.style.transition = 'transform 0.2s ease';
    container.appendChild(enemyDiv);
    return { ...unit, div: enemyDiv };
  });

  renderUI(player, grid, score, level, health);
}

export function renderUI(player, grid, score, level, health) {
  player.div.style.transform = `translate(${player.x * cellSize}px, ${player.y * cellSize}px)`;

  grid.units.forEach(unit => {
    unit.div.style.transform = `translate(${unit.x * cellSize}px, ${unit.y * cellSize}px)`;
  });


  const info = document.getElementById('info');
  if (info) {
    info.innerText = `Уровень: ${level} | Очки: ${score} | Здоровье: ${health}`;
  }
}
