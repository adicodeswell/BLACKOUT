const fs = require('fs');
const path = 'src/screens/MapScreen.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove the floating header and filter container
const topBlockRegex = /\{\/\* 1\. Floating Operational Header \*\/\}(.|\n)*?\{\/\* Location Error \/ Status Banner if unavailable \*\/\}/gm;
code = code.replace(topBlockRegex, `
        {/* Location Error / Status Banner if unavailable */}`);

// 2. Helper for category icons
const helperInjection = `const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'FIRE': return 'FIRE';
    case 'MEDICAL': return 'MEDICAL';
    case 'FOOD': return 'FOOD';
    case 'WATER': return 'WATER';
    case 'SHELTER': return 'SHELTER';
    case 'INFRASTRUCTURE_COLLAPSE': return 'BLOCKED_ROAD';
    case 'ROAD_BLOCKED': return 'BLOCKED_ROAD';
    default: return 'WARNING';
  }
};

const MapScreen: React.FC = () => {`;
code = code.replace(`const MapScreen: React.FC = () => {`, helperInjection);

// 3. Update Incident Marker to use category icon
code = code.replace(
  `<NavIcon name="Alerts" color="#FFFFFF" size={14} />`,
  `<NavIcon name={getCategoryIcon(inc.category) as any} color="#FFFFFF" size={14} />`
);

// 4. Update controlsContainer to bottom left and add the filter buttons
const controlsRegex = /\{\/\* 4\. Floating Map Control Buttons \*\/\}(.|\n)*?\{\/\* 5\. Selected Marker Detail Bottom Sheet \*\/\}/gm;

const newControls = `{/* 4. Floating Map Control Buttons (Bottom Left) */}
      <View style={[styles.controlsContainer, selectedMarker ? { bottom: 270 } : { bottom: 24 }]}>
        
        {/* Toggle Buttons */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { marginBottom: 8, backgroundColor: filterIncidents ? theme.colors.dangerBg : theme.colors.surface, borderColor: filterIncidents ? theme.colors.primaryDanger : theme.colors.surfaceBorder },
          ]}
          onPress={() => setFilterIncidents(!filterIncidents)}
          activeOpacity={0.7}
        >
          <NavIcon name="WARNING" color={filterIncidents ? theme.colors.dangerText : theme.colors.textSecondary} size={16} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { marginBottom: 8, backgroundColor: filterResources ? theme.colors.infoBg : theme.colors.surface, borderColor: filterResources ? theme.colors.accent : theme.colors.surfaceBorder },
          ]}
          onPress={() => setFilterResources(!filterResources)}
          activeOpacity={0.7}
        >
          <NavIcon name="PLUS" color={filterResources ? theme.colors.infoText : theme.colors.textSecondary} size={16} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { marginBottom: 16, backgroundColor: filterHazards ? theme.colors.warningBg : theme.colors.surface, borderColor: filterHazards ? theme.colors.warningBorder : theme.colors.surfaceBorder },
          ]}
          onPress={() => setFilterHazards(!filterHazards)}
          activeOpacity={0.7}
        >
          <NavIcon name="BLOCKED_ROAD" color={filterHazards ? theme.colors.warningText : theme.colors.textSecondary} size={16} />
        </TouchableOpacity>

        <View style={{width: 30, height: 1, backgroundColor: theme.colors.surfaceBorder, marginBottom: 16}} />

        {/* Existing Map Controls */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
          ]}
          onPress={handleZoomIn}
          activeOpacity={0.7}
        >
          <NavIcon name="PLUS" color={theme.colors.textPrimary} size={16} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
              borderTopWidth: 0,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: 22,
              borderBottomRightRadius: 22,
              marginTop: -22,
              paddingTop: 22,
              marginBottom: 8
            },
          ]}
          onPress={handleZoomOut}
          activeOpacity={0.7}
        >
          <View style={{ width: 12, height: 2, backgroundColor: theme.colors.textPrimary, marginTop: 10 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
              marginBottom: 8
            },
          ]}
          onPress={handleRecenter}
          activeOpacity={0.7}
        >
          <NavIcon name="LOCATION" color={theme.colors.primary} size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
            },
          ]}
          onPress={() => setShowLegend(!showLegend)}
          activeOpacity={0.7}
        >
          <NavIcon name="INFO" color={showLegend ? theme.colors.primary : theme.colors.textSecondary} size={16} />
        </TouchableOpacity>
      </View>

      {/* 5. Selected Marker Detail Bottom Sheet */}`;

code = code.replace(controlsRegex, newControls);

// 5. Change controlsContainer CSS from right: 12 to left: 12
code = code.replace(/right: 12,\n    zIndex: 20,\n    alignItems: 'center',/g, "left: 12,\n    zIndex: 20,\n    alignItems: 'center',");

fs.writeFileSync(path, code);
