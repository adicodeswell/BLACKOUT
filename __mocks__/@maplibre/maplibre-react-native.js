const React = require('react');
const { View } = require('react-native');

const MockComponent = (props) => {
  return React.createElement(View, props, props.children);
};

module.exports = {
  Map: MockComponent,
  MapView: MockComponent,
  Camera: MockComponent,
  Marker: MockComponent,
  ViewAnnotation: MockComponent,
  GeoJSONSource: MockComponent,
  Layer: MockComponent,
  UserLocation: MockComponent,
  OfflineManager: {
    createPack: jest.fn(),
    deletePack: jest.fn(),
    getPacks: jest.fn(),
  },
  setAccessToken: jest.fn(),
  default: {
    Map: MockComponent,
    MapView: MockComponent,
    Camera: MockComponent,
    Marker: MockComponent,
    ViewAnnotation: MockComponent,
    GeoJSONSource: MockComponent,
    Layer: MockComponent,
    UserLocation: MockComponent,
    setAccessToken: jest.fn(),
  },
};
