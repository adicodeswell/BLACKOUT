const fs = require('fs');
const path = 'src/services/EmergencyReportService.ts';
let code = fs.readFileSync(path, 'utf8');

const constructorRegex = /constructor\([^)]+\)\s*\{[^}]*\}/;
const newConstructor = `constructor(
    private readonly dataEngine: DataEngine,
    private readonly geoEngine: GeoEngine,
    private readonly networkEngine: NetworkEngine
  ) {
    // Listen for incoming Emergency Reports and save them to the local database
    this.networkEngine.subscribe(async (event) => {
      if (event.type === 'MESSAGE_RECEIVED') {
        const msg = event.message;
        if (msg.message_type === 'REPORT' && msg.payload) {
          try {
            // Save incoming mesh reports into our local SQLite
            await this.dataEngine.createReport(msg.payload as any);
          } catch (e) {
            console.error('Failed to save incoming mesh report', e);
          }
        }
      }
    });
  }`;

code = code.replace(constructorRegex, newConstructor);
fs.writeFileSync(path, code);
