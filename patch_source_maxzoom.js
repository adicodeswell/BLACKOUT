const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace in DARK_MAP_STYLE
code = code.replace(
  `tileSize: 256,
      attribution: '© MapLibre © OpenStreetMap contributors',
    },
  },`,
  `tileSize: 256,
      maxzoom: 16,
      attribution: '© Esri',
    },
  },`
);

// Replace in LIGHT_MAP_STYLE (if it matches the same pattern)
code = code.replace(
  `tileSize: 256,
      attribution: '© MapLibre © OpenStreetMap contributors',
    },
  },`,
  `tileSize: 256,
      maxzoom: 16,
      attribution: '© Esri',
    },
  },`
);

fs.writeFileSync(path, code);
