export function playEnemyBehavior(enemy, grid, timer, player) {
  let dx, dy;

  switch (enemy.behavior) {
    case 'worm':
      const dirs = [[1,0], [-1,0], [0,1], [0,-1], [0, 0]];
      let turn;

      if (distance(enemy, player) === 0) {
        [dx, dy] = [0, 0];
        break;
      }

      do {
        [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
        turn = { x: enemy.x + dx, y: enemy.y + dy }
      } while (distance(turn, player) >= distance(enemy, player))

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
        const dirs = [[1,0], [-1,0], [0,1], [0,-1], [0, 0]];
        let turn;

        do {
          [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
          turn = { x: enemy.x + dx, y: enemy.y + dy }
        } while (distance(turn, player) >= distance(enemy, player))
      } else {
        const dirs = [[1,0], [-1,0], [0,1], [0,-1], [0, 0]];
        [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
      }

      if (timer % 10 === 0 && Math.random() < 0.33) {
        grid.units.push({ ...enemy, id: Date.now() + Math.random(), div: null });
      }
      break;
    }

    case 'spy': {
      const dist = distance(player, enemy);
      if (dist < 3) {
        dx = player.x < enemy.x ? 1 : player.x > enemy.x ? -1 : 0;
        dy = player.y < enemy.y ? 1 : player.y > enemy.y ? -1 : 0;
      } else if (dist > 5) {
        dx = player.x > enemy.x ? 1 : player.x < enemy.x ? -1 : 0;
        dy = player.y > enemy.y ? 1 : player.y < enemy.y ? -1 : 0;
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

      return dirs[Math.floor(Math.random() * dirs.length)];
    }
  }

  return [dx, dy];
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
