const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace getCategoryIcon with getCategoryEmoji
const iconRegex = /const getCategoryIcon = \(category: string\) => \{[\s\S]*?\};/m;
const emojiInjection = `const getCategoryEmoji = (category: string) => {
  switch (category) {
    case 'FIRE': return '🔥';
    case 'MEDICAL': return '🚑';
    case 'FOOD': return '🍔';
    case 'WATER': return '💧';
    case 'SHELTER': return '⛺';
    case 'INFRASTRUCTURE_COLLAPSE': return '🚧';
    case 'ROAD_BLOCKED': return '🛑';
    default: return '⚠️';
  }
};`;
code = code.replace(iconRegex, emojiInjection);

// Replace NavIcon with Text in Marker
const navIconRegex = /<NavIcon name=\{getCategoryIcon\(inc\.category\) as any\} color="#FFFFFF" size=\{14\} \/>/g;
const textReplacement = `<Text style={{ fontSize: 16 }}>{getCategoryEmoji(inc.category)}</Text>`;
code = code.replace(navIconRegex, textReplacement);

fs.writeFileSync(path, code);
