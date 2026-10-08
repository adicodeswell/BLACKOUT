const fs = require('fs');
const path = 'src/adapters/network/NativeNetworkEngineAdapter.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `  async discoverPeers(): Promise<Result<PeerDto[]>> {
    // Native bridge getPeers is not yet exposed by Java module. Return empty list (no fake peers).
    return { ok: true, data: [] };
  }

  async getPeers(): Promise<Result<PeerDto[]>> {
    // Native bridge getPeers is not yet exposed by Java module. Return empty list (no fake peers).
    return { ok: true, data: [] };
  }`;

const inject1 = `  async discoverPeers(): Promise<Result<PeerDto[]>> {
    try {
      await this.bridge.discoverPeers();
      return this.getPeers();
    } catch (e: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: e.message, retryable: true, module: 'NETWORK' } };
    }
  }

  async getPeers(): Promise<Result<PeerDto[]>> {
    try {
      const peers = await this.bridge.getPeers();
      return { ok: true, data: peers };
    } catch (e: any) {
      return { ok: false, error: { code: 'UNAVAILABLE', message: e.message, retryable: true, module: 'NETWORK' } };
    }
  }`;

code = code.replace(target1, inject1);
fs.writeFileSync(path, code);
