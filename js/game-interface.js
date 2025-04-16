let playerDiv;

export function renderGame(grid, player, score, level, health) {
  const container = document.getElementById('game');
  container.innerHTML = '';

  const width = grid.map[0].length;
  const height = grid.map.length;

  container.style.gridTemplateColumns = `repeat(${width}, 32px)`;
  container.style.gridTemplateRows = `repeat(${height}, 32px)`;
  container.style.width = `${width * 32}px`;
  container.style.height = `${height * 32}px`;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cellDiv = document.createElement('div');
      cellDiv.className = 'cell ' + grid.map[y][x].type;
      container.appendChild(cellDiv);
    }
  }

  playerDiv = document.createElement('div');
  playerDiv.className = 'unit player';
  container.appendChild(playerDiv);

  grid.units = grid.units.map(unit => {
    const enemyDiv = document.createElement('div');
    enemyDiv.className = 'unit enemy';
    enemyDiv.style.transition = 'transform 0.2s ease';
    container.appendChild(enemyDiv);
    return { ...unit, div: enemyDiv };
  });

  renderUI(player, grid, score, level, health);
}

export function renderUI(player, grid, score, level, health) {
  playerDiv.style.transform = `translate(${player.x * 32}px, ${player.y * 32}px)`;

  grid.units.forEach(unit => {
    unit.div.style.transform = `translate(${unit.x * 32}px, ${unit.y * 32}px)`;
  });


  const info = document.getElementById('info');
  if (info) {
    info.innerText = `Уровень: ${level} | Очки: ${score} | Здоровье: ${health}`;
  }
}
