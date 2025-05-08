let prevWidth = 16;
let prevHeight = 10;
const minWidth = 8, minHeight = 8;
const maxWidth = 64, maxHeight = 256;
const enemyTypes = ['worm', 'bug', 'zombie', 'spy', 'backdoor', 'trojan'];

export function generateMap(level) {
  if (level === 1) {
    prevWidth = 16;
    prevHeight = 10;
  }

  const delta = () => Math.floor(Math.random() * 5.5) - 2;
  prevWidth = Math.max(minWidth, Math.min(maxWidth, prevWidth + delta()));
  prevHeight = Math.max(minHeight, Math.min(maxHeight, prevHeight + delta()));

  let map, portals, units = [], width = prevWidth, height = prevHeight;

  while (true) {
    map = [];
    portals = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        chooseCellType(x, y, level, portals, row);
      }
      map.push(row);
    }

    if (portals.length === 1) {
      let portal = portals.at(0);
      map[portal.y][portal.x] = { type: 'empty' };
      portals = [];
    }

    map[1][1] = { type: 'start' };
    map[height - 2][width - 2] = { type: 'exit' };

    if (checkMap(map, 1, 1)) break;
  }

  let grid = {
    map: map,
    units: units,
    portals: portals
  };

  for (let i = 0; i < Math.random() * level * 1.001; i++) {
    spawnEnemy({ x: 1, y: 1}, grid, level);
  }

  return grid;
}

export function spawnEnemy(player, grid, level) {
  let x, y;
  do {
    x = Math.floor(Math.random() * grid.map[0].length);
    y = Math.floor(Math.random() * grid.map.length);
  } while (grid.map[y][x].type === 'wall' || grid.map[y][x].type === 'exit' || (x === player.x && y === player.y));

  grid.units.push(chooseEnemyType(x, y, level));
}

function checkMap(map, startX, startY) {
  const height = map.length;
  const width = map[0].length;
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const queue = [[startX, startY]];
  visited[startY][startX] = true;
  const directions = [[0,1],[1,0],[-1,0],[0,-1]];

  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of directions) {
      const nx = x + dx, ny = y + dy;
      if (ny >= 0 && ny < height && nx >= 0 && nx < width && !visited[ny][nx]) {
        const cell = map[ny][nx];
        if (cell.type !== 'wall') {
          visited[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = map[y][x];
      if (cell.type !== 'wall' && !visited[y][x]) {
        return false;
      }
    }
  }

  return true;
}

function chooseEnemyType(x, y, level) {
  return {
    x: x,
    y: y,
    type: 'enemy',
    behavior: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
    id: Date.now() + Math.random(),
    div: null,
    cooldown: 0,
    health: 16
  };
}

function accessChance(chanceConst) {
  return Math.random() < Math.random() / chanceConst;
}

function chooseCellType(x, y, level, portals, row) {
  const WALL_SPAWN = 2.2719281928, PORTAL_SPAWN = 32, HEAL_SPAWN = 48, SCOREUP_SPAWN = 64, FIRE_SPAWN = 128;

  if (accessChance(WALL_SPAWN)) {
    row.push({ type: 'wall' });
  } else if (level > 7 && accessChance(PORTAL_SPAWN)) {
    row.push({ type: 'portal' });
    portals.push({ x: x, y: y })
  } else if (level > 3 && accessChance(HEAL_SPAWN)) {
    row.push({ type: 'heal' });
  } else if (level > 9 && accessChance(SCOREUP_SPAWN)) {
    row.push({ type: 'scoreUp' });
  } else if (level > 1 && accessChance(FIRE_SPAWN)) {
    row.push({ type: 'fire' });
  } else {
    row.push({ type: 'empty' });
  }
}
