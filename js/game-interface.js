export function renderGame(map, player, score, level) {
  const container = document.getElementById('game');
  container.innerHTML = '';

  map.forEach((row, y) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'row';

    row.forEach((cell, x) => {
      const cellDiv = document.createElement('div');
      cellDiv.className = 'cell ' + cell;

      if (player.x === x && player.y === y) {
        cellDiv.classList.add('player');
      }

      rowDiv.appendChild(cellDiv);
    });

    container.appendChild(rowDiv);
  });

  const info = document.getElementById('info');
  if (info) {
    info.innerText = `Level: ${level} | Score: ${score}`;
  }
}
