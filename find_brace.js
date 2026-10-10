const fs = require('fs');
const content = fs.readFileSync('android/app/src/main/java/com/blackout/network/discovery/WifiDirectManager.java', 'utf8');
let depth = 0;
const lines = content.split('\n');
for(let i=0; i<lines.length; i++) {
  const line = lines[i];
  for(let j=0; j<line.length; j++) {
    if (line[j] === '{') depth++;
    if (line[j] === '}') depth--;
    if (depth < 0) {
      console.log('Extra closing brace found at line', i+1);
      process.exit();
    }
  }
}
console.log('Final depth', depth);
