import re

with open('src/screens/MapScreen.tsx', 'r') as f:
    content = f.read()

target = """        {/* Location Error / Status Banner if unavailable */}
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
      </View>"""

replacement = """        {/* Location Error / Status Banner if unavailable */}
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
        ) : null}"""

content = content.replace(target, replacement)

with open('src/screens/MapScreen.tsx', 'w') as f:
    f.write(content)
