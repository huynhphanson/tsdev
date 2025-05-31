// modelGroups.js
export const modelGroups = {};

export function addToModelGroup(category, mesh) {
  if (!modelGroups[category]) {
    modelGroups[category] = [];
  }
  modelGroups[category].push(mesh);
}

