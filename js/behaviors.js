export function playEnemyBehavior(enemy, grid, timer, player) {
  let dx, dy;

  switch (enemy.behavior) {
    case 'worm':
      [dx, dy] = smartMove(enemy, player, grid);
      break;

    case 'bug': {
      const dirs = [[1,0], [-1,0], [0,1], [0,-1], [0, 0]];
      [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
      break;
    }

    case 'zombie': {
      const dist = distance(player, enemy);
      if (dist === 0) {
        [dx, dy] = [0, 0];
      } else if (dist <= 5) {
        [dx, dy] = smartMove(enemy, player, grid);
      } else {
        const dirs = [[1,0], [-1,0], [0,1], [0,-1], [0, 0]];
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

      if (dist < 3) {
        [dx, dy] = smartMove(enemy, { x: enemy.x - player.x, y: enemy.y - player.y, detectedRate: player.detectedRate}, grid);
      } else if (dist > 4) {
        [dx, dy] = smartMove(enemy, player, grid);
      }

      break;
    }

    case 'backdoor': {
      if (timer % 2 === 0) {
        enemy.div.classList.add('hidden');
      } else {
        enemy.div.classList.remove('hidden');
      }

      const dirs = [
        [1,0], [-1,0], [0,1], [0,-1],
        [1,1], [-1,-1], [1,-1], [-1,1], [0, 0]
      ];

      [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
      break;
    }
  }

  if (player.detectedRate >= 100.0) {
    return smartMove(enemy, player, grid)
  }

  return [dx, dy];
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function canMove(pos, grid) {
  let [x, y] = pos;
  return grid.map[y] && grid.map[y][x] && grid.map[y][x].type !== 'wall';
}

function smartMove(enemy, player, grid) {
  const dirs = [
    [1,0], [-1,0], [0,1], [0,-1], [0, 0]
  ];
  let res = dirs
    .map(([dx, dy]) => [enemy.x + dx, enemy.y + dy, distance({ x: enemy.x + dx, y: enemy.y + dy }, player)])
    .filter((e) => canMove(e, grid))
    .sort((a, b) => a[2] - b[2])
    .map(([x, y, dist]) => [x - enemy.x, y - enemy.y]);
  if (res) return res[0];
  else return [0, 0];
}
