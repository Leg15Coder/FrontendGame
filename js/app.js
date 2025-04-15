import { generateMap } from './generator.js';
import { renderGame } from './game-interface.js';

let level = 1;
let score = 0;
let player = { x: 1, y: 1 };
let map = [];

function findStart(map) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      if (map[y][x] === 'start') return { x, y };
    }
  }
  return { x: 1, y: 1 };
}

function startLevel() {
  map = generateMap(level);
  player = findStart(map);
  renderGame(map, player, score, level);
}

function movePlayer(dx, dy) {
  const newX = player.x + dx;
  const newY = player.y + dy;

  if (newY < 0 || newY >= map.length || newX < 0 || newX >= map[0].length) return;
  const nextCell = map[newY][newX];

  if (nextCell === 'wall') return;

  player.x = newX;
  player.y = newY;

  if (nextCell === 'fire') score -= 10;
  if (nextCell === 'enemy') score -= 20;
  if (nextCell === 'exit') {
    score += 100;
    level++;
    return startLevel();
  }

  if (score < -50) {
    return gameOver();
  }

  renderGame(map, player, score, level);
}

async function gameOver() {
  const name = prompt("Game Over! Enter your name:");
  if (name) {
    const record = { name, score, level, time: new Date().toISOString() };

    await fetch('/api/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  }

  score = 0;
  level = 1;
  startLevel();
}



window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': movePlayer(0, -1); break;
    case 'ArrowDown': movePlayer(0, 1); break;
    case 'ArrowLeft': movePlayer(-1, 0); break;
    case 'ArrowRight': movePlayer(1, 0); break;
  }
});

startLevel();

window.showRecords = async function () {
  const res = await fetch('/api/records');
  const records = await res.json();

  const table = `
    <table border="1" cellpadding="6" style="margin: auto; background: #222; color: white;">
      <tr>
        <th>#</th><th>Name</th><th>Score</th><th>Level</th><th>Time</th>
      </tr>
      ${records.map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${r.name}</td>
          <td>${r.score}</td>
          <td>${r.level}</td>
          <td>${new Date(r.time).toLocaleString()}</td>
        </tr>
      `).join('')}
    </table>
  `;

  document.getElementById("records").innerHTML = table;
};

window.navigate = function (section) {
  document.getElementById('aboutSection').style.display = 'none';
  document.getElementById('gameSection').style.display = 'none';
  document.getElementById('recordsSection').style.display = 'none';

  if (section === 'records') {
    showRecords();
  }

  const id = section + 'Section';
  document.getElementById(id).style.display = 'block';
};

