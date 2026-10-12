import React from 'react';
import App from '../App';
import renderer from 'react-test-renderer';

// Mock the native module so the test doesn't crash in Node.js
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.BlackoutNativeModule = {
    pingNative: jest.fn().mockResolvedValue({ status: "OK", native: true })
  };
  return RN;
});

it('renders correctly', async () => {
  await React.act(async () => {
    renderer.create(<App />);
  });
});
