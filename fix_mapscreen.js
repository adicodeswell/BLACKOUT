const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

const helperInjection = `const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'FIRE': return 'FIRE';
    case 'MEDICAL': return 'MEDICAL';
    case 'FOOD': return 'FOOD';
    case 'WATER': return 'WATER';
    case 'SHELTER': return 'SHELTER';
    case 'INFRASTRUCTURE_COLLAPSE': return 'BLOCKED_ROAD';
    case 'ROAD_BLOCKED': return 'BLOCKED_ROAD';
    default: return 'WARNING';
  }
};

export const MapScreen`;

code = code.replace("export const MapScreen", helperInjection);
fs.writeFileSync(path, code);
