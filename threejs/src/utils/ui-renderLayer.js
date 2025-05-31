import * as THREE from 'three';
import { zoomAt } from '../three/three-controls';

// === utils.js hoặc nằm chung file ===
function toggleObjects(groupObjs, visible) {
  groupObjs.forEach(obj => {
    obj.visible = visible;

    if (obj.constructor?.name === 'CSS2DObject') {
      if (!visible) obj.parent?.remove(obj);
      else obj.userData.originalParent?.add(obj);
    }

    // Gán layer rõ ràng thay vì nhớ layer cũ
    obj.layers.set(visible ? 0 : 1);

    if (obj.children?.length) {
      toggleObjects(obj.children, visible);
    }
  });
}



function zoomToGroup(groupObjs, camera, controls) {
  const bbox = new THREE.Box3();
  groupObjs.forEach(obj => bbox.expandByObject(obj));

  const center = bbox.getCenter(new THREE.Vector3());
  const direction = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
  const distance = bbox.getSize(new THREE.Vector3()).length() * 1.2;

  const newPos = center.clone().add(direction.multiplyScalar(distance));

  zoomAt(center, newPos, camera, controls);
}


function createLayerRow(name, groupObjs, camera, controls) {
  const row = document.createElement('div');
  row.className = 'layer-row';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = true;

  const label = document.createElement('label');
  label.textContent = name;
  label.style.cursor = 'pointer';
  label.addEventListener('click', () => {
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event('change'));
  });

  const zoomBtn = document.createElement('span');
  zoomBtn.className = 'zoom-icon';
  zoomBtn.title = 'Zoom đến mô hình';
  zoomBtn.innerHTML = '<i class="fa-solid fa-map-location-dot"></i>';
  zoomBtn.style.cursor = 'pointer';
  zoomBtn.addEventListener('click', () => zoomToGroup(groupObjs, camera, controls));

  checkbox.addEventListener('change', () => toggleObjects(groupObjs, checkbox.checked));

  const span = document.createElement('span');
  span.className = 'toggle-icon placeholder';

  row.appendChild(span);
  row.appendChild(checkbox);
  row.appendChild(label);
  row.appendChild(zoomBtn);
  return row;
}

function createSingleChildRow(parent, child, groupObjs, camera, controls) {
  return createLayerRow(child, groupObjs, camera, controls);
}

function createParentGroup(parent, children, camera, controls) {
  const groupDiv = document.createElement('div');
  groupDiv.className = 'layer-group';

  const row = document.createElement('div');
  row.className = 'layer-row';

  const toggle = document.createElement('span');
  toggle.className = 'toggle-icon';
  toggle.textContent = '▶';

  const parentCheckbox = document.createElement('input');
  parentCheckbox.type = 'checkbox';
  parentCheckbox.checked = true;

  const parentLabel = document.createElement('label');
  parentLabel.textContent = parent;
  parentLabel.style.cursor = 'pointer';
  parentLabel.addEventListener('click', () => {
    parentCheckbox.checked = !parentCheckbox.checked;
    parentCheckbox.dispatchEvent(new Event('change'));
  });

  const allGroupObjs = Object.values(children).flat();
  const zoomBtn = document.createElement('span');
  zoomBtn.className = 'zoom-icon';
  zoomBtn.title = 'Zoom đến nhóm';
  zoomBtn.innerHTML = '<i class="fa-solid fa-map-location-dot"></i>';
  zoomBtn.style.cursor = 'pointer';
  zoomBtn.addEventListener('click', () => zoomToGroup(allGroupObjs, camera, controls));

  row.appendChild(toggle);
  row.appendChild(parentCheckbox);
  row.appendChild(parentLabel);
  row.appendChild(zoomBtn);
  groupDiv.appendChild(row);

  const childContainer = document.createElement('div');
  childContainer.className = 'child-group';

  Object.entries(children).forEach(([childName, groupObjs]) => {
    const childRow = document.createElement('div');
    childRow.className = 'layer-row child-indent';

    const placeholder = document.createElement('span');
    placeholder.className = 'toggle-icon placeholder';

    const childCheckbox = document.createElement('input');
    childCheckbox.type = 'checkbox';
    childCheckbox.checked = true;

    const childLabel = document.createElement('label');
    childLabel.textContent = childName;
    childLabel.style.cursor = 'pointer';
    childLabel.addEventListener('click', () => {
      childCheckbox.checked = !childCheckbox.checked;
      childCheckbox.dispatchEvent(new Event('change'));
    });

    const zoomBtn = document.createElement('span');
    zoomBtn.className = 'zoom-icon';
    zoomBtn.title = 'Zoom đến lớp';
    zoomBtn.innerHTML = '<i class="fa-solid fa-map-location-dot"></i>';
    zoomBtn.style.cursor = 'pointer';
    zoomBtn.addEventListener('click', () => zoomToGroup(groupObjs, camera, controls));

    childCheckbox.addEventListener('change', () => {
      toggleObjects(groupObjs, childCheckbox.checked);
      syncParentCheckbox();
    });

    childRow.appendChild(placeholder);
    childRow.appendChild(childCheckbox);
    childRow.appendChild(childLabel);
    childRow.appendChild(zoomBtn);
    childContainer.appendChild(childRow);
  });

  groupDiv.appendChild(childContainer);

  toggle.addEventListener('click', () => {
    const isOpen = childContainer.classList.contains('open');
    childContainer.style.maxHeight = isOpen ? '0px' : childContainer.scrollHeight + 'px';
    childContainer.classList.toggle('open');
    toggle.textContent = isOpen ? '▶' : '▼';
  });

  parentCheckbox.addEventListener('change', () => {
    const checked = parentCheckbox.checked;
    childContainer.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.checked = checked;
      cb.dispatchEvent(new Event('change'));
    });
  });

  function syncParentCheckbox() {
    const all = [...childContainer.querySelectorAll('input[type=checkbox]')];
    const allChecked = all.every(cb => cb.checked);
    const someChecked = all.some(cb => cb.checked);
    parentCheckbox.checked = allChecked;
    parentCheckbox.indeterminate = !allChecked && someChecked;
  }

  return groupDiv;
}

function groupModelKeys(modelGroups) {
  const parentGroups = {};
  Object.keys(modelGroups).forEach(fullName => {
    if (fullName.includes('/')) {
      const [parent, child] = fullName.split('/');
      if (!parentGroups[parent]) parentGroups[parent] = {};
      parentGroups[parent][child] = modelGroups[fullName];
    } else {
      parentGroups[fullName] = null;
    }
  });
  return parentGroups;
}

// === main ===
export function renderLayerContent(modelGroups, camera, controls) {
  const layerContent = document.getElementById('layerContent');
  layerContent.innerHTML = '';

  const parentGroups = groupModelKeys(modelGroups);

  Object.entries(parentGroups).forEach(([parent, children]) => {
    if (children === null) {
      layerContent.appendChild(createLayerRow(parent, modelGroups[parent], camera, controls));
    } else {
      const childKeys = Object.keys(children);
      if (childKeys.length === 1) {
        const onlyChild = childKeys[0];
        layerContent.appendChild(createSingleChildRow(parent, onlyChild, children[onlyChild], camera, controls));
      } else {
        layerContent.appendChild(createParentGroup(parent, children, camera, controls));
      }
    }
  });
}
