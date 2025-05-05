import { generateMap, spawnEnemy } from './generator.js';
import { renderGame } from './game-interface.js';
import { playEnemyBehavior } from './behaviors.js'

const API_URL = "https://leg15coder-devdungeon.deno.dev";

let touchStartX = null;
let touchStartY = null;

let level = 1;
let score = 0;
let player = { x: 1, y: 1, detectedRate: 0, health: 20 };
let grid;
let timer = 0;
let isGameOver = false;

function startLevel() {
  timer = 0;
  grid = generateMap(level);
  player = { x: 1, y: 1, detectedRate: (player.detectedRate + 1) / 2, health: player.health };
  renderGame(grid, player, score, level, true);
}

function movePlayer(dx, dy) {
  let newX = player.x + dx;
  let newY = player.y + dy;
  timer++;

  if (timer > level * 64) {
    player.detectedRate += 0.1;
    player.detectedRate *= 1.01;
  }

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

  if (nextCell.type === 'fire') {
    player.health -= 5;
    grid.map[newY][newX].type = 'empty';
  } else if (nextCell.type === 'heal') {
    player.health += 5;
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

  if (player.health <= 0) {
    renderGame(grid, player, score, level, false);
    return gameOver();
  }

  renderGame(grid, player, score, level, false);
}

function moveEnemies() {
  const newUnits = [];

  if (grid.units.length === 0) {
    spawnEnemy(player, grid);
    renderGame(grid, player, score, level, false);
  }

  for (let enemy of grid.units) {
    if (enemy.health <= 0) {
      const container = document.getElementById('game');
      container.removeChild(enemy.div);
      continue;
    }

    let x = enemy.x, y = enemy.y, enemyHealth = enemy.health;
    let dx, dy;

    if (enemy.cooldown <= 0) {
      [dx, dy] = playEnemyBehavior(enemy, grid, timer, player)
      enemy.cooldown = 0;
    } else {
      [dx, dy] = [0, 0];
      enemy.cooldown--;
    }

    const newX = x + dx;
    const newY = y + dy;

    if (
      newY >= 0 && newY < grid.map.length &&
      newX >= 0 && newX < grid.map[0].length &&
      grid.map[newY][newX].type !== 'wall' &&
      grid.map[newY][newX].type !== 'exit'
    ) {
      if (grid.map[newY][newX].type === 'fire') {
        enemyHealth -= 4;
        if (enemyHealth <= 0 || enemy.health <= 0) {
          const container = document.getElementById('game');
          container.removeChild(enemy.div);
          continue;
        }
      }
      enemy.x = newX;
      enemy.y = newY;
      enemy.health = enemyHealth;
    } else {
      if (grid.map[enemy.y][enemy.x].type === 'fire') {
        enemyHealth -= 4;
        if (enemyHealth <= 0 || enemy.health <= 0) {
          const container = document.getElementById('game');
          container.removeChild(enemy.div);
          continue;
        }
      }
    }
    newUnits.push(enemy);
  }

  grid.units = newUnits;

  for (let enemy of grid.units) {
    if (enemy.type === 'enemy' && enemy.x === player.x && enemy.y === player.y) {
      enemy.cooldown++;
      player.health -= 20;
    }
  }
}

function resetGame() {
  score = 0;
  player.health = 20;
  level = 1;
  isGameOver = false;
  player.detectedRate = 0;
  startLevel();
}

async function gameOver() {
  const modal = document.getElementsByClassName('modal-overlay').item(0);
  const scores_modal = document.getElementById('scores');
  const levels_modal = document.getElementById('levels');
  isGameOver = true;
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

  if (!isGameOver) {
    switch (event.key.toLowerCase()) {
      case 'arrowup': movePlayer(0, -1); break;
      case 'w': movePlayer(0, -1); break;
      case 'ц': movePlayer(0, -1); break;
      case 'arrowdown': movePlayer(0, 1); break;
      case 's': movePlayer(0, 1); break;
      case 'ы': movePlayer(0, 1); break;
      case 'arrowleft': movePlayer(-1, 0); break;
      case 'a': movePlayer(-1, 0); break;
      case 'ф': movePlayer(-1, 0); break;
      case 'arrowright': movePlayer(1, 0); break;
      case 'd': movePlayer(1, 0); break;
      case 'в': movePlayer(1, 0); break;
      case ' ': movePlayer(0, 0); break;
    }
  }
});

startLevel();

window.showRecords = async function () {
  const userName = document.getElementById("search-user").value;
  const limit = document.getElementById("search-limit").value;
  let url = `${API_URL}/api/records`;

  if (limit) url += `?limit=${limit}`;
  if (userName && limit) url += `&userName=${userName}`;
  else if (userName) url += `?userName=${userName}`;

  const res = await fetch(url);
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
  const sections = ['about', 'play', 'stats', 'settings'];
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
    stats: document.getElementById('section-stats'),
    settings: document.getElementById('section-settings')
  };

  const volumeSlider = document.getElementById('volume-slider');
  const music = document.getElementById('bg-music');
  const musicButton = document.getElementById('toggle-music');

  const buttons = {
    about: document.getElementById('btn-about'),
    play: document.getElementById('btn-play'),
    stats: document.getElementById('btn-stats'),
    settings: document.getElementById('btn-settings')
  };

  function showSection(name) {
    Object.values(sections).forEach(section => section.classList.add('hidden'));
    sections[name].classList.remove('hidden');
  }

  buttons.about.addEventListener('click', () => navigate('about'));
  buttons.play.addEventListener('click', () => navigate('play'));
  buttons.stats.addEventListener('click', () => navigate('stats'));
  buttons.settings.addEventListener('click', () => navigate('settings'));

  musicButton.addEventListener('click', () => {
    if (music.paused) {
      music.play();
      musicButton.textContent = '🎵 Музыка: Вкл';
    } else {
      music.pause();
      musicButton.textContent = '🔇 Музыка: Выкл';
    }
  });

  volumeSlider.addEventListener('input', () => {
    music.volume = volumeSlider.value;
  });

  document.addEventListener('click', () => {
    if (music.paused) {
      music.play().catch(e => console.warn('Ошибка воспроизведения:', e));
    }
  }, { once: true });

  document.getElementById("search-btn").onclick = window.showRecords;

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
