let prevWidth = 16;
let prevHeight = 10;
const minWidth = 8, minHeight = 8;
const maxWidth = 64, maxHeight = 256;
const enemyTypes = ['worm', 'bug', 'zombie', 'spy', 'backdoor'];

function chooseEnemyType(level) {
  return enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
}

export function generateMap(level) {
  if (level === 1) {
    prevWidth = 16;
    prevHeight = 10;
  }

  const delta = () => Math.floor(Math.random() * 5.5) - 2;
  prevWidth = Math.max(minWidth, Math.min(maxWidth, prevWidth + delta()));
  prevHeight = Math.max(minHeight, Math.min(maxHeight, prevHeight + delta()));

  let map, portals, baths, units = [], width = prevWidth, height = prevHeight, ids = 0;

  while (true) {
    map = [];
    portals = [];
    baths = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        if (Math.random() < Math.random() / 2.2719281928) {
          row.push({ type: 'wall' });
        } else if (level > 7 && Math.random() < Math.random() / 32) {
          row.push({ type: 'portal' });
          portals.push({ x: x, y: y })
        } else if (level > 3 && Math.random() < Math.random() / 48) {
          row.push({ type: 'heal' });
          baths.push({ x: x, y: y, type: 'heal' })
        } else if (level > 9 && Math.random() < Math.random() / 64) {
          row.push({ type: 'scoreUp' });
          baths.push({ x: x, y: y, type: 'scoreUp' })
        } else if (level > 1 && Math.random() < Math.random() / 128) {
          row.push({ type: 'fire' });
        } else {
          row.push({ type: 'empty' });
        }
      }
      map.push(row);
    }

    map[1][1] = { type: 'start' };
    map[height - 2][width - 2] = { type: 'exit' };

    if (checkMap(map, 1, 1)) break;
  }

  for (let i = 0; i < Math.floor(Math.random() * level * 1.0001) + 1; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * width);
      y = Math.floor(Math.random() * height);
    } while (map[y][x].type !== 'empty');

    units.push({ x: x, y: y, type: 'enemy', behavior: chooseEnemyType(level), id: ids++, div: null, cooldown: 0, health: 10 });
  }

  return {
    map: map,
    units: units,
    portals: portals
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
