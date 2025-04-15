export function generateMap(level) {
  const rows = 8 + level * 2;
  const cols = 12 + level * 2;
  const map = [];

  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      const rand = Math.random();

      if (rand < 0.12) row.push('wall');
      else if (rand < 0.15 && level >= 2) row.push('fire');
      else if (rand < 0.17 && level >= 3) row.push('enemy');
      else row.push('empty');
    }
    map.push(row);
  }

  map[1][1] = 'start';
  map[rows - 2][cols - 2] = 'exit';

  return map;
}
