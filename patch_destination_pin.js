const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

const routeDestInjection = `              <LineLayer
                id="route-line"
                style={{
                  lineColor: theme.colors.primary,
                  lineWidth: 4,
                  lineCap: 'round',
                  lineJoin: 'round',
                  lineDasharray: [2, 2],
                }}
              />
            </ShapeSource>
          )}
          
          {/* Active Route Destination Marker */}
          {activeRoute && activeRoute.destination && (
            <Marker
              key="route-dest"
              id="route-dest"
              anchor={{x: 0.5, y: 0.5}}
              lngLat={[activeRoute.destination.longitude, activeRoute.destination.latitude]}
            >
              <View style={[styles.markerAnchor, { zIndex: 100 }]}>
                 <Text style={{ fontSize: 20 }}>🏁</Text>
              </View>
            </Marker>
          )}`;

code = code.replace(`              <LineLayer
                id="route-line"
                style={{
                  lineColor: theme.colors.primary,
                  lineWidth: 4,
                  lineCap: 'round',
                  lineJoin: 'round',
                  lineDasharray: [2, 2],
                }}
              />
            </ShapeSource>
          )}`, routeDestInjection);

fs.writeFileSync(path, code);
