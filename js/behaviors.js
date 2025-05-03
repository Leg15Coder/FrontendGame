export function playEnemyBehavior(enemy, grid, timer, player) {
  let dx, dy, dirs = [[1,0], [-1,0], [0,1], [0,-1]];

  switch (enemy.behavior) {
    case 'worm':
      [dx, dy] = chase(enemy, player, grid);
      break;

    case 'bug': {
      dirs = [[1,0], [-1,0], [0,1], [0,-1], [0, 0]];
      [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
      break;
    }

    case 'zombie': {
      const dist = distance(player, enemy);
      if (dist === 0) {
        [dx, dy] = [0, 0];
      } else if (dist <= 5) {
        if (Math.random() > 0.5) {
          [dx, dy] = smartMove(enemy, player, grid, dirs);
        } else {
          [dx, dy] = chase(enemy, player, grid);
        }
      } else {
        dirs = [[1,0], [-1,0], [0,1], [0,-1], [0, 0]];
        [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
      }

      if (timer % 10 === 0 && Math.random() < 0.33) {
        grid.units.push({ ...enemy, id: Date.now() + Math.random(), div: null, cooldown: 1 });
      }
      break;
    }

    case 'spy': {
      const dist = distance(player, enemy);
      if (dist === 0) player.detectedRate += 8;
      else if (dist <= 4) player.detectedRate += 1;

      const target = { ...player };

      if (dist < 3) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        target.x = enemy.x + Math.sign(dx);
        target.y = enemy.y + Math.sign(dy);
      } else if (dist > 4) {
        target.x = player.x;
        target.y = player.y;
      } else {
        target.x = enemy.x;
        target.y = enemy.y;
      }

      [dx, dy] = smartMove(enemy, target, grid, dirs);
      break;
    }

    case 'backdoor': {
      if (timer % 2 === 0) {
        enemy.div.classList.add('hidden');
      } else {
        enemy.div.classList.remove('hidden');
      }

      dirs = [
        [1,0], [-1,0], [0,1], [0,-1],
        [1,1], [-1,-1], [1,-1], [-1,1], [0, 0]
      ];

      [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
      break;
    }
  }

  if (player.detectedRate >= 100.0) {
    return smartMove(enemy, player, grid, dirs)
  }

  return [dx, dy];
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function canMove(pos, grid) {
  let [x, y] = pos;
  return grid.map[y] && grid.map[y][x] && grid.map[y][x].type !== 'wall' && grid.map[y][x].type !== 'exit';
}

function smartMove(enemy, player, grid, directions) {
  const openSet = [{ x: enemy.x, y: enemy.y, g: 0, h: distance(enemy, player), parent: null }];
  const closedSet = new Set();
  const key = (x, y) => `${x},${y}`;

  while (openSet.length > 0) {
    openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
    const current = openSet.shift();
    closedSet.add(key(current.x, current.y));

    if (current.x === player.x && current.y === player.y) {
      let step = current;
      while (step.parent && step.parent.parent) step = step.parent;
      return [step.x - enemy.x, step.y - enemy.y];
    }

    for (const [dx, dy] of directions) {
      const nx = current.x + dx, ny = current.y + dy;
      if (!canMove([nx, ny], grid) || closedSet.has(key(nx, ny))) continue;

      const g = current.g + 1;
      const h = distance({ x: nx, y: ny }, player);
      const existing = openSet.find(n => n.x === nx && n.y === ny);

      if (!existing || g < existing.g) {
        if (existing) {
          existing.g = g;
          existing.parent = current;
        } else {
          openSet.push({ x: nx, y: ny, g: g, h: h, parent: current });
        }
      }
    }
  }

  return [0, 0];
}

function chase(enemy, player, grid) {
  const dirs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const options = dirs
    .map(([mx, my]) => {
      const nx = enemy.x + mx;
      const ny = enemy.y + my;
      if (!canMove([nx, ny], grid)) return null;
      return { mx, my, dist: distance({ x: nx, y: ny }, player) };
    })
    .filter(Boolean)
    .sort((a, b) => a.dist - b.dist);

  if (!options) return [0, 0];

  return [options[0].mx, options[0].my];
}


