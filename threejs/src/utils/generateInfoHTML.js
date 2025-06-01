export function generateInfoHTML(meta) {
  if (!meta) return '<div>No data</div>';

  const toRow = (key, value) => {
    const isURL = typeof value === 'string' && /^https?:\/\//.test(value);
    const display = isURL
      ? `<a href="${value}" target="_blank" style="color: blue;">${value}</a>`
      : value;
    return `
      <tr>
        <td style="padding: 4px 8px; font-weight: bold; vertical-align: top;">${key}</td>
        <td style="padding: 4px 8px;">${display}</td>
      </tr>
    `;
  };

  const section = (title, rows) => `
    <h3 style="margin: 8px 0 4px;">${title}</h3>
    <table style="border-collapse: collapse; width: 100%; font-size: 13px;">${rows}</table>
  `;

  const formatVector = (v) => {
    if (!v) return '---';
    if (Array.isArray(v)) {
      return `(${v[0].toFixed(2)}, ${v[1].toFixed(2)}, ${v[2].toFixed(2)})`;
    }
    if (typeof v === 'object' && 'x' in v) {
      return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;
    }
    return '---';
  };

  const htmlSections = [];

  // General
  const isDrawPol = meta.X !== undefined && meta.Y !== undefined && meta.Z !== undefined;

  const generalRows = isDrawPol
    ? [
        toRow('Desc', meta.name || meta.Desc || '---'),
        toRow('X(E)', meta.X.toFixed(3)),
        toRow('Y(N)', meta.Y.toFixed(3)),
        toRow('Z(H)', meta.Z.toFixed(3)),
      ]
    : [
        toRow('Name', meta.name || '---'),
        toRow('ID', meta.id),
        toRow('Size', formatVector(meta.size)),
        toRow('Center', formatVector(meta.center)),
      ];



  htmlSections.push(section('General', generalRows.join('')));

  // Grouped fields
  const userData = meta.userData || {};
  const prefixCount = {};
  const grouped = {};

  for (const key in userData) {
    const [prefix, subKey] = key.split('.', 2);
    if (!subKey) continue;

    prefixCount[prefix] = (prefixCount[prefix] || 0) + 1;
    if (!grouped[prefix]) grouped[prefix] = {};
    grouped[prefix][subKey] = userData[key];
  }

  // Render only groups with ≥ 2 fields
  for (const prefix in grouped) {
    if (prefixCount[prefix] < 2) continue;
    const rows = Object.entries(grouped[prefix]).map(([k, v]) => toRow(k, v)).join('');
    htmlSections.push(section(prefix, rows));
  }

  return `
  <div class="info-panel-container"
    <div class="info-panel">
      ${htmlSections.join('')}
    </div>
  </div>
  `;
}
