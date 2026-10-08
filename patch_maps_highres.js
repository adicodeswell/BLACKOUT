const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

const darkSearch = `const DARK_MAP_STYLE: any = {
  version: 8,
  name: 'BLACKOUT Dark Emergency Map',
  sources: {
    demotiles: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],`;

const darkReplace = `const DARK_MAP_STYLE: any = {
  version: 8,
  name: 'BLACKOUT Dark Emergency Map',
  sources: {
    demotiles: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],`;

code = code.replace(darkSearch, darkReplace);

const lightSearch = `const LIGHT_MAP_STYLE: any = {
  version: 8,
  name: 'BLACKOUT Light Emergency Map',
  sources: {
    demotiles: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],`;

const lightReplace = `const LIGHT_MAP_STYLE: any = {
  version: 8,
  name: 'BLACKOUT Light Emergency Map',
  sources: {
    demotiles: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'],`;

code = code.replace(lightSearch, lightReplace);

const onlineFallbackSearch = `tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'] // Temporary online fallback for visual testing`;
const onlineFallbackReplace = `// Fallback gets dynamically chosen based on theme, we shouldn't hardcode OSM here.
            // Let's use baseStyle's tiles instead of hardcoding OSM.
            tiles: baseStyle.sources.demotiles.tiles // Temporary online fallback using base style's retina tiles`;

code = code.replace(onlineFallbackSearch, onlineFallbackReplace);

fs.writeFileSync(path, code);
