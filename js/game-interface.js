let playerDiv;
let enemyDivs = [];

export function renderGame(map, player, score, level, health) {
  const container = document.getElementById('game');
  container.innerHTML = '';

  const width = map[0].length;
  const height = map.length;

  container.style.gridTemplateColumns = `repeat(${width}, 32px)`;
  container.style.gridTemplateRows = `repeat(${height}, 32px)`;
  container.style.width = `${width * 32}px`;
  container.style.height = `${height * 32}px`;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cellDiv = document.createElement('div');
      cellDiv.className = 'cell ' + map[y][x].type;
      container.appendChild(cellDiv);
    }
  }

  playerDiv = document.createElement('div');
  playerDiv.className = 'unit player';
  container.appendChild(playerDiv);

  enemyDivs = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (map[y][x].type === 'enemy') {
        const enemyDiv = document.createElement('div');
        enemyDiv.className = 'unit enemy';
        container.appendChild(enemyDiv);
        enemyDivs.push({ div: enemyDiv, x, y });
      }
    }
  }

  renderUI(player, map, score, level, health);
}

export function renderUI(player, map, score, level, health) {
  playerDiv.style.transform = `translate(${player.x * 32}px, ${player.y * 32}px)`;

  enemyDivs.forEach(enemy => {
    const cell = map[enemy.y][enemy.x];
    if (cell.type !== 'enemy') return;
    enemy.div.style.transform = `translate(${enemy.x * 32}px, ${enemy.y * 32}px)`;
  });

  const info = document.getElementById('info');
  if (info) {
    info.innerText = `Level: ${level} | Score: ${score} | Health: ${health}`;
  }
}
