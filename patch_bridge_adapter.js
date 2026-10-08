const fs = require('fs');
const path = 'src/adapters/native/NativeBridgeAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `  async stopNetworking(): Promise<Result<void>> {`;
const inject1 = `  async getPeers(): Promise<any[]> {
    return BlackoutNativeModule.getPeers();
  }

  async discoverPeers(): Promise<void> {
    return BlackoutNativeModule.discoverPeers();
  }

  async stopNetworking(): Promise<Result<void>> {`;

code = code.replace(target1, inject1);
fs.writeFileSync(path, code);
