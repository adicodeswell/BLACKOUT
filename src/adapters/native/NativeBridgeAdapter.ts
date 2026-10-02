import { NativeModules } from 'react-native';

export class NativeBridgeAdapter {
  async pingNative(): Promise<{ ok: boolean; data?: any; error?: any }> {
    try {
      const data = await NativeModules.BlackoutNativeModule.pingNative();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
