import { generateMap } from './generator.js';
import { renderGame } from './game-interface.js';
import { playEnemyBehavior } from './behaviors.js'

const API_URL = "https://leg15coder-devdungeon.deno.dev";

let touchStartX = null;
let touchStartY = null;

let level = 1;
let score = 0;
let health = 20;
let player = { x: 1, y: 1 };
let grid;
let timer = 0;

function findStart(map) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      if (map[y][x].type === 'start') return { x, y };
    }
  }
  return { x: 1, y: 1 };
}

function startLevel() {
  timer = 0;
  grid = generateMap(level);
  player = findStart(grid.map);
  renderGame(grid, player, score, level, health, true);
}

function movePlayer(dx, dy) {
  let newX = player.x + dx;
  let newY = player.y + dy;
  timer++;

  if (newY < 0 || newY >= grid.map.length || newX < 0 || newX >= grid.map[0].length) return;
  let nextCell = grid.map[newY][newX];

  if (nextCell.type === 'wall') return;
  if (dx === 0 && dy === 0 && nextCell.type === 'portal') {
    let targetPortal = grid.portals[Math.floor(Math.random() * grid.portals.length)]
    newY = targetPortal.y;
    newX = targetPortal.x;
    nextCell = grid.map[newY][newX];
  }

  player.x = newX;
  player.y = newY;

  if (nextCell.type === 'fire') health -= 2;
  else if (nextCell.type === 'heal') {
    health += 5;
    grid.map[newY][newX].type = 'empty';
  } else if (nextCell.type === 'scoreUp') {
    score += 50;
    grid.map[newY][newX].type = 'empty';
  } else if (nextCell.type === 'exit') {
    score += 10;
    level++;
    return startLevel();
  } else if (nextCell.type === 'portal') {
    const hintDiv = document.getElementsByClassName("hint").item(0);
    hintDiv.classList.remove('hidden');
    hintDiv.innerHTML = 'Нажмите пробел чтобы телепортироваться'
  } else {
    const hintDiv = document.getElementsByClassName("hint").item(0);
    hintDiv.classList.add('hidden');
  }

  moveEnemies();

  if (health <= 0) {
    return gameOver();
  }

  renderGame(grid, player, score, level, health, false);
}

function moveEnemies() {
  const newUnits = [];
  for (let enemy of grid.units) {
    const { x, y, type, behavior, id, div } = enemy;

    let [ dx, dy ] = playEnemyBehavior(enemy, grid, timer, player)

    const newX = x + dx;
    const newY = y + dy;

    if (
      newY >= 0 && newY < grid.map.length &&
      newX >= 0 && newX < grid.map[0].length &&
      grid.map[newY][newX].type !== 'wall' &&
      grid.map[newY][newX].type !== 'exit'
    ) {
      newUnits.push({ x: newX, y: newY, type, behavior, id, div });
    } else {
      newUnits.push(enemy);
    }
  }

  grid.units = newUnits;

  for (let enemy of grid.units) {
    if (enemy.type === 'enemy' && enemy.x === player.x && enemy.y === player.y) {
      health -= 20;
    }
  }
}

function resetGame() {
  score = 0;
  health = 20;
  level = 1;
  startLevel();
}

async function gameOver() {
  const modal = document.getElementsByClassName('modal-overlay').item(0);
  const scores_modal = document.getElementById('scores');
  const levels_modal = document.getElementById('levels');
  scores_modal.innerHTML = `Очков набрано: ${score}`
  levels_modal.innerHTML = `Уровней пройдено: ${level}`
  modal.classList.remove('hidden');

  return new Promise((resolve) => {
    document.getElementById('submit-score').addEventListener('click', async () => {
      const name = document.getElementById('player-name').value.trim();
      if (name) {
        const record = { name, score, level, time: new Date().toISOString() };

        await fetch(`${API_URL}/api/record`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(record)
        });
      }

      modal.classList.add('hidden');
      resetGame();
      resolve();
    });

    document.getElementById('skip-submit').addEventListener('click', () => {
      modal.classList.add('hidden');
      resetGame();
      resolve();
    });
  });
}

window.addEventListener('keydown', (event) => {
  const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
  if (keys.includes(event.key)) {
    event.preventDefault();
  }

  switch (event.key) {
    case 'ArrowUp': movePlayer(0, -1); break;
    case 'w': movePlayer(0, -1); break;
    case 'ArrowDown': movePlayer(0, 1); break;
    case 's': movePlayer(0, 1); break;
    case 'ArrowLeft': movePlayer(-1, 0); break;
    case 'a': movePlayer(-1, 0); break;
    case 'ArrowRight': movePlayer(1, 0); break;
    case 'd': movePlayer(1, 0); break;
    case ' ': movePlayer(0, 0); break;
  }
});

startLevel();

window.showRecords = async function () {
  const res = await fetch(`${API_URL}/api/records`);
  const records = await res.json();

  const table = `
    <table border="1" cellpadding="6" style="margin: auto; background: #222; color: white;" class="leaderboard">
      <tr>
        <th>№</th><th>Ник</th><th>Очки</th><th>Уровень</th><th>Время</th>
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
  const sections = ['about', 'play', 'stats'];
  sections.forEach(name => {
    document.getElementById(`section-${name}`).classList.add('hidden');
    document.getElementById(`section-${name}`).classList.remove('active');
  });

  if (section === 'stats') {
    showRecords();
  }

  const current = document.getElementById(`section-${section}`);
  current.classList.remove('hidden');
  current.classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
  const sections = {
    about: document.getElementById('section-about'),
    play: document.getElementById('section-play'),
    stats: document.getElementById('section-stats')
  };

  const buttons = {
    about: document.getElementById('btn-about'),
    play: document.getElementById('btn-play'),
    stats: document.getElementById('btn-stats')
  };

  function showSection(name) {
    Object.values(sections).forEach(section => section.classList.add('hidden'));
    sections[name].classList.remove('hidden');
  }

  buttons.about.addEventListener('click', () => navigate('about'));
  buttons.play.addEventListener('click', () => navigate('play'));
  buttons.stats.addEventListener('click', () => navigate('stats'));

  showSection('about');
});

document.addEventListener("touchstart", e => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, false);

document.addEventListener("touchend", e => {
  if (!touchStartX || !touchStartY) return;

  const deltaX = e.changedTouches[0].screenX - touchStartX;
  const deltaY = e.changedTouches[0].screenY - touchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 30) movePlayer(1, 0);
    else if (deltaX < -30) movePlayer(-1, 0);
    else movePlayer(0, 0);
  } else {
    if (deltaY > 30) movePlayer(0, 1);
    else if (deltaY < -30) movePlayer(0, -1);
    else movePlayer(0, 0);
  }

  touchStartX = null;
  touchStartY = null;
}, false);

