const fs = require('fs');
const path = 'src/adapters/geo/NativeGeoEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

const importStatement = `import { NativeModules, NativeEventEmitter, PermissionsAndroid } from 'react-native';`;
code = code.replace(/import { NativeModules, NativeEventEmitter } from 'react-native';/, importStatement);

const requestPerms = `
  private async requestPermissions() {
    try {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    } catch (e) {
      console.warn('Failed to request location permission', e);
    }
  }
`;

code = code.replace('export class NativeGeoEngineAdapter implements GeoEngine {', 'export class NativeGeoEngineAdapter implements GeoEngine {' + requestPerms);

const initCall = `
  async initialize(): Promise<Result<void>> {
    await this.requestPermissions();
`;
code = code.replace(/async initialize\(\): Promise<Result<void>> \{/, initCall);

const startTrackingCall = `
  async startTracking(): Promise<Result<void>> {
    await this.requestPermissions();
`;
code = code.replace(/async startTracking\(\): Promise<Result<void>> \{/, startTrackingCall);

fs.writeFileSync(path, code);
