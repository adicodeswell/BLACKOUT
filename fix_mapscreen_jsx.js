const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
\`        {/* Location Error / Status Banner if unavailable */}
        {locationState === 'UNAVAILABLE' || locationError ? (
          <View
            style={[
              styles.locationBanner,
              { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningBorder },
            ]}
          >
            <NavIcon name="LOCATION" color={theme.colors.warningText} size={14} />
            <Text style={[styles.locationBannerText, { color: theme.colors.warningText }]}>
              LOCATION UNAVAILABLE • Viewing offline incident & resource layer
            </Text>
          </View>
        ) : null}
      </View>\`, 
\`        {/* Location Error / Status Banner if unavailable */}
        {locationState === 'UNAVAILABLE' || locationError ? (
          <View
            style={[
              styles.locationBanner,
              { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningBorder, position: 'absolute', top: 12, left: 12, right: 12, zIndex: 30 },
            ]}
          >
            <NavIcon name="LOCATION" color={theme.colors.warningText} size={14} />
            <Text style={[styles.locationBannerText, { color: theme.colors.warningText }]}>
              LOCATION UNAVAILABLE • Viewing offline incident & resource layer
            </Text>
          </View>
        ) : null}\`
);

fs.writeFileSync(path, code);
