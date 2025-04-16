export function generateMap(level) {
  const width = 15 + level;
  const height = 9 + level;
  const map = [];
  const enemyTypes = ['horizontal', 'vertical', 'random', 'chaser'];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push({ type: (Math.random() < 0.1 ? 'wall' : 'empty') });
    }
    map.push(row);
  }

  map[1][1] = { type: 'start' };
  map[height - 2][width - 2] = { type: 'exit' };

  for (let i = 0; i < level + 2; i++) {
    const x = Math.floor(Math.random() * (width - 2)) + 1;
    const y = Math.floor(Math.random() * (height - 2)) + 1;
    if (map[y][x].type === 'empty') map[y][x] = { type: 'fire' };
  }

  for (let i = 0; i < level; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * (width - 2)) + 1;
      y = Math.floor(Math.random() * (height - 2)) + 1;
    } while (map[y][x].type !== 'empty');

    map[y][x] = { type: 'enemy', behavior: enemyTypes[i % enemyTypes.length], direction: 1 };
  }

  return map;
}
