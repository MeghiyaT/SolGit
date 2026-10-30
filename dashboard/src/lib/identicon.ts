export function getIdenticonGrid(address: string): { grid: boolean[][]; color: string } {
  const clean = (address || "0x0000000000000000000000000000000000000000")
    .toLowerCase()
    .replace(/^0x/, "");

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }

  const hue = Math.abs(hash % 360);
  const color = `hsl(${hue}, 65%, 50%)`;

  const grid: boolean[][] = [];
  for (let r = 0; r < 5; r++) {
    const row: boolean[] = [];
    const val0 = (Math.abs(hash >> (r * 3)) & 1) === 1;
    const val1 = (Math.abs(hash >> (r * 3 + 1)) & 1) === 1;
    const val2 = (Math.abs(hash >> (r * 3 + 2)) & 1) === 1;

    // Symmetric 5 columns: 0, 1, 2, 1, 0
    row.push(val0, val1, val2, val1, val0);
    grid.push(row);
  }

  return { grid, color };
}

