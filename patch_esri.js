const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

const darkSearch = `const DARK_MAP_STYLE: any = {
  version: 8,
  name: 'BLACKOUT Dark Emergency Map',
  sources: {
    demotiles: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],`;

const darkReplace = `const DARK_MAP_STYLE: any = {
  version: 8,
  name: 'BLACKOUT Dark Emergency Map',
  sources: {
    demotiles: {
      type: 'raster',
      tiles: ['https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],`;

code = code.replace(darkSearch, darkReplace);

const lightSearch = `const LIGHT_MAP_STYLE: any = {
  version: 8,
  name: 'BLACKOUT Light Emergency Map',
  sources: {
    demotiles: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'],`;

const lightReplace = `const LIGHT_MAP_STYLE: any = {
  version: 8,
  name: 'BLACKOUT Light Emergency Map',
  sources: {
    demotiles: {
      type: 'raster',
      tiles: ['https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'],`;

code = code.replace(lightSearch, lightReplace);

fs.writeFileSync(path, code);
