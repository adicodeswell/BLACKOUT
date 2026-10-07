const fs = require('fs');
let file;

// Fix EmergencyReportScreen.tsx
file = fs.readFileSync('src/screens/EmergencyReportScreen.tsx', 'utf8');
file = file.replace(/import \{ StatusPill \} from '\.\.\/components\/StatusPill';/g, '');
fs.writeFileSync('src/screens/EmergencyReportScreen.tsx', file);

// Fix IncidentService.ts
file = fs.readFileSync('src/services/IncidentService.ts', 'utf8');
file = file.replace(/import type \{ BlackoutError \} from '\.\.\/contracts\/common\/BlackoutError';/g, '');
fs.writeFileSync('src/services/IncidentService.ts', file);

// Fix RuleBasedAIEngine.ts
file = fs.readFileSync('src/services/RuleBasedAIEngine.ts', 'utf8');
file = file.replace(/export async function suggestAction\(request: SuggestActionRequest\)/g, 'export async function suggestAction(_request: SuggestActionRequest)');
fs.writeFileSync('src/services/RuleBasedAIEngine.ts', file);

