export let ranhVertices2D = [];

export async function loadRanhCSV() {
  const res = await fetch('../../resources/assets/ranh.csv');
  const csv = await res.text();

  const lines = csv.trim().split('\n');
  const ranhVertices2D = lines.map(line => {
    const [x, y, z] = line.split(',').map(Number);
    return { x, y, z }; // hoặc chỉ { x, y } nếu chỉ cần polygon 2D
  }).filter(p => !isNaN(p.x) && !isNaN(p.y));

  return ranhVertices2D;
}
