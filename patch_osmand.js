const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace Dark Style
const darkSearch = `    demotiles: {
      type: 'raster',
      tiles: ['https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 16,
      attribution: '© Esri',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#0F131C',
      },
    },
    {
      id: 'base-tiles',
      type: 'raster',
      source: 'demotiles',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-opacity': 0.75,
        'raster-brightness-max': 0.55,
        'raster-contrast': 0.25,
        'raster-saturation': -0.5,
      },
    },`;

const darkReplace = `    demotiles: {
      type: 'raster',
      tiles: ['https://tile.osmand.net/hd/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OsmAnd',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#0F131C',
      },
    },
    {
      id: 'base-tiles',
      type: 'raster',
      source: 'demotiles',
      minzoom: 0,
      maxzoom: 22,
      paint: {
        'raster-opacity': 0.8,
        'raster-brightness-max': 0.4,
        'raster-saturation': -0.8,
        'raster-contrast': 0.4,
      },
    },`;

code = code.replace(darkSearch, darkReplace);

// Replace Light Style
const lightSearch = `    demotiles: {
      type: 'raster',
      tiles: ['https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 16,
      attribution: '© Esri',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#FFFFFF',
      },
    },
    {
      id: 'base-tiles',
      type: 'raster',
      source: 'demotiles',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-opacity': 1.0,
      },
    },`;

const lightReplace = `    demotiles: {
      type: 'raster',
      tiles: ['https://tile.osmand.net/hd/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OsmAnd',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#FFFFFF',
      },
    },
    {
      id: 'base-tiles',
      type: 'raster',
      source: 'demotiles',
      minzoom: 0,
      maxzoom: 22,
      paint: {
        'raster-opacity': 1.0,
      },
    },`;

code = code.replace(lightSearch, lightReplace);

fs.writeFileSync(path, code);
