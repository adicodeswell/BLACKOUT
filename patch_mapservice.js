const fs = require('fs');
const path = 'src/services/MapService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `async getResources(): Promise<Result<ResourceDto[]>> {
    return this.dataEngine.listResources();
  }
}`,
  `async getResources(): Promise<Result<ResourceDto[]>> {
    return this.dataEngine.listResources();
  }

  async calculateRoute(start: LocationDto, destination: LocationDto): Promise<Result<import("../contracts/geo/RouteDto").RouteDto>> {
    return this.geoEngine.calculateRoute(start, destination, {
      avoid_hazards: true,
      avoid_blocked_roads: true,
    });
  }
}`
);

fs.writeFileSync(path, code);
