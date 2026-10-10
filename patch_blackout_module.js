const fs = require('fs');
const file = 'android/app/src/main/java/com/blackout/bridge/BlackoutNativeModule.java';
let content = fs.readFileSync(file, 'utf8');

const target = `                        }
                    } catch (Exception e) {
                        Log.e("BlackoutNativeModule", "Error formatting peer", e);
                    }
                }
            });`;

const replacement = `                        }
                    } catch (Exception e) {
                        Log.e("BlackoutNativeModule", "Error formatting peer", e);
                    }
                }

                @Override
                public void onConnectionStateChanged(String deviceAddress, com.blackout.network.discovery.WifiDirectManager.State state) {
                    if (state == com.blackout.network.discovery.WifiDirectManager.State.CONNECTING) {
                        com.facebook.react.bridge.WritableMap peerMap = com.facebook.react.bridge.Arguments.createMap();
                        peerMap.putString("peer_id", deviceAddress);
                        peerMap.putString("connection_state", "CONNECTING");
                        peerMap.putString("transport", "WIFI_DIRECT");
                        com.facebook.react.bridge.WritableMap event = com.facebook.react.bridge.Arguments.createMap();
                        event.putString("type", "PEER_CONNECTED"); 
                        event.putMap("peer", peerMap);
                        getReactApplicationContext()
                                .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("NativeEvent", event);
                    }
                }
            });`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
