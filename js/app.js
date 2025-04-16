import { generateMap } from './generator.js';
import { renderGame, renderUI } from './game-interface.js';

const API_URL = "https://leg15coder-frontendgam-30.deno.dev";

let level = 1;
let score = 0;
let health = 20;
let player = { x: 1, y: 1 };
let map = [];

function findStart(map) {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      if (map[y][x].type === 'start') return { x, y };
    }
  }
  return { x: 1, y: 1 };
}

function startLevel() {
  map = generateMap(level);
  player = findStart(map);
  renderGame(map, player, score, level, health);
}

function movePlayer(dx, dy) {
  const newX = player.x + dx;
  const newY = player.y + dy;

  if (newY < 0 || newY >= map.length || newX < 0 || newX >= map[0].length) return;
  const nextCell = map[newY][newX];

  if (nextCell.type === 'wall') return;

  player.x = newX;
  player.y = newY;

  if (nextCell.type === 'fire') health -= 2;
  if (nextCell.type === 'exit') {
    score += 100;
    level++;
    return startLevel();
  }

  if (health <= 0) {
    return gameOver();
  }

  moveEnemies();
  renderUI(player, map, score, level, health);
}

function moveEnemies() {
  const newMap = map.map(row => row.slice());
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      const cell = map[y][x];
      if (cell.type === 'enemy') {
        const { type, behavior, direction } = cell;
        let dx = 0, dy = 0;

        if (behavior === 'horizontal') {
          dx = direction === 1 ? 1 : -1;
        } else if (behavior === 'vertical') {
          dy = direction === 1 ? 1 : -1;
        } else if (behavior === 'random') {
          const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
          [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
        } else if (behavior === 'follow') {
          dx = player.x > x ? 1 : player.x < x ? -1 : 0;
          dy = player.y > y ? 1 : player.y < y ? -1 : 0;
        }

        const newX = x + dx;
        const newY = y + dy;

        if (
          newY >= 0 && newY < map.length &&
          newX >= 0 && newX < map[0].length &&
          map[newY][newX].type !== 'wall' &&
          map[newY][newX].type !== 'exit'
        ) {
          newMap[y][x] = null;
          newMap[newY][newX] = { ...cell, direction };
        } else {
          if (behavior === 'horizontal' || behavior === 'vertical') {
            cell.direction *= -1;
          }
        }
      }
    }
  }

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      if (newMap[y][x] === null) newMap[y][x] = { type: 'empty' };
    }
  }

  map = newMap;

  if (map[player.y][player.x].type === 'enemy') {
    health -= 20;
    if (score <= 0) {
      return gameOver();
    }
  }
}

async function gameOver() {
  const name = prompt("Game Over! Enter your name:");
  if (name) {
    const record = { name, score, level, time: new Date().toISOString() };

    await fetch(`${API_URL}/api/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  }

  score = 0;
  health = 20;
  level = 1;
  startLevel();
}

window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': movePlayer(0, -1); break;
    case 'ArrowDown': movePlayer(0, 1); break;
    case 'ArrowLeft': movePlayer(-1, 0); break;
    case 'ArrowRight': movePlayer(1, 0); break;
    case ' ': movePlayer(0, 0); break;
  }
});

startLevel();

window.showRecords = async function () {
  const res = await fetch(`${API_URL}/api/record`);
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

