const fs = require('fs');
const path = 'src/contracts/geo/RouteDto.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `export interface MapLoadResult {
  region: MapRegion;
  available: boolean;
  source: "BUNDLED" | "LOCAL_CACHE";
}`;
const inject1 = `export interface MapLoadResult {
  region: MapRegion;
  available: boolean;
  source: "BUNDLED" | "LOCAL_CACHE";
  path?: string;
}`;

code = code.replace(target1, inject1);
fs.writeFileSync(path, code);
