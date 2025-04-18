let prevWidth = 16;
let prevHeight = 10;
const minWidth = 8, minHeight = 8;
const maxWidth = 128, maxHeight = 48;
const enemyTypes = ['worm', 'bug', 'zombie', 'spy', 'backdoor'];

function chooseEnemyType(level) {
  return enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
}

export function generateMap(level) {
  const delta = () => Math.floor(Math.random() * 5 + 0.5) - 2;
  prevWidth = Math.max(minWidth, Math.min(maxWidth, prevWidth + delta()));
  prevHeight = Math.max(minHeight, Math.min(maxHeight, prevHeight + delta()));

  let map, units = [], width = prevWidth, height = prevHeight, ids = 0;

  while (true) {
    map = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        row.push({ type: Math.random() < Math.random() / 3 ? 'wall' : 'empty' });
      }
      map.push(row);
    }

    map[1][1] = { type: 'start' };
    map[height - 2][width - 2] = { type: 'exit' };

    if (checkMap(map, 1, 1)) break;
  }

  for (let i = 0; i < level + 2; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (map[y][x].type === 'empty') map[y][x] = { type: 'fire' };
  }

  for (let i = 0; i < level; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * width);
      y = Math.floor(Math.random() * height);
    } while (map[y][x].type !== 'empty');

    units.push({ x: x, y: y, type: 'enemy', behavior: chooseEnemyType(level), id: ids++, div: null });
  }

  return {
    map: map,
    units: units
  };
}

function checkMap(map, startX, startY) {
  const height = map.length;
  const width = map[0].length;
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const queue = [[startX, startY]];
  visited[startY][startX] = true;

  const directions = [[0,1],[1,0],[-1,0],[0,-1]];
  let reachable = 1;

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
