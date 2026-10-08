const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

const target1 = `  const currentMapStyle = theme.mode === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;`;
const inject1 = `  const currentMapStyle = useMemo(() => {
    const baseStyle = theme.mode === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
    
    // If we have an offline MBTiles file extracted to the device, override the tile source
    if (offlineMapResult?.path) {
      return {
        ...baseStyle,
        sources: {
          ...baseStyle.sources,
          demotiles: {
            ...baseStyle.sources.demotiles,
            tiles: [\`mbtiles://\${offlineMapResult.path}\`]
          }
        }
      };
    }
    return baseStyle;
  }, [theme.mode, offlineMapResult]);`;

code = code.replace(target1, inject1);
fs.writeFileSync(path, code);
