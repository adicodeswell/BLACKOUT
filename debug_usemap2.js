const fs = require('fs');
const path = 'src/hooks/useMap.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import { Alert }")) {
  code = code.replace("import { useState, useEffect, useCallback, useRef } from 'react';", "import { useState, useEffect, useCallback, useRef } from 'react';\nimport { Alert } from 'react-native';");
}

code = code.replace(
  `// Alert if currentLocation is missing
        console.warn("calculateRouteTo: currentLocation is null!");`,
  `Alert.alert("Error", "Current Location is missing. Cannot route.");`
);

code = code.replace(
  `console.error("Route Error", res.error);`,
  `Alert.alert("Route Error", res.error.message || String(res.error));`
);

fs.writeFileSync(path, code);
