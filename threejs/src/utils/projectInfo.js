export function initProjectInfo(config) {
  const infoList = config.projectInfo || [];

  const existing = document.getElementById('project-overlay');
  if (existing) {
    const panel = document.getElementById('project-panel');
    if (panel) {
      panel.style.top = '20%';
      panel.style.opacity = 0;
      existing.style.opacity = 0;
      existing.addEventListener('transitionend', () => existing.remove(), { once: true });
    } else {
      existing.remove();
    }
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'project-overlay';

  const panel = document.createElement('div');
  panel.id = 'project-panel';

  const content = document.createElement('div');
  content.innerHTML = `
    <h3 style="text-transform: uppercase;">Thông tin dự án</h3>
    <table style="width: 100%; border-spacing: 6px;">
      ${infoList.map(item => `
        <tr>
          <td style="font-weight: bold; color: #ddd;">${item.label.toUpperCase()}</td>
          <td style="color: #fff;">${item.value.toUpperCase()}</td>
        </tr>
      `).join('')}
    </table>
  `;

  panel.appendChild(content);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = 1;
    panel.style.top = '50%';
    panel.style.opacity = 1;
  });
}
