const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
const lines = c.split('\n');
let newLines = [];
let removed = false;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('</div>') && !removed && i > lines.length - 10) {
        removed = true;
        continue;
    }
    newLines.unshift(lines[i]);
}
fs.writeFileSync('src/App.tsx', newLines.join('\n'));
