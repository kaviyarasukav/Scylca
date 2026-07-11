const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(filepath, 'utf8');

// 1. Find Engine Control block
const engineControlStartStr = '            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">\n              <h2 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Engine Control</h2>';
const engineControlStart = content.indexOf(engineControlStartStr);

if (engineControlStart === -1) {
    console.log("Could not find Engine Control start");
    process.exit(1);
}

// Find the end of Engine Control block. We know it ends with two </div>s, followed by the Main Content Column comment.
// Let's search for the Main Content Column comment that precedes Active Trading Slots
const activeTradingSlotsStartStr = '          {/* Main Content Column */}\n          <div className="md:col-span-2 flex flex-col gap-6">\n            {/* Active Trading Slots */}';
const activeTradingSlotsStart = content.indexOf(activeTradingSlotsStartStr);

if (activeTradingSlotsStart === -1) {
    console.log("Could not find Active Trading Slots start");
    process.exit(1);
}

// Extract Engine Control block
const engineControlEnd = activeTradingSlotsStart; 
// Wait, before activeTradingSlotsStart, there is:
// 2110:               </div>
// 2111:             </div>
// 2112:           </div>
// 2113: 
// 2114:           {/* Main Content Column */}

// So Engine Control block is from engineControlStart to the </div> at 2110.
// Let's use a regex to capture exactly the Engine Control block and remove it from its current place.
// Actually, it's safer to just split and slice.
const lines = content.split('\n');

let engineStartLine = -1;
let engineEndLine = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Engine Control</h2>')) {
        engineStartLine = i - 1; // The div opens on the line before
    }
    if (lines[i].includes('{/* Active Trading Slots */}')) {
        // The Engine Control block ends a few lines before this.
        // It ends at line 2110. The closing tags are:
        // 2109:               </div>
        // 2110:             </div>
        // 2111:           </div>
        engineEndLine = i - 4; 
        break;
    }
}

if (engineStartLine === -1 || engineEndLine === -1) {
    console.log("Could not find lines");
    process.exit(1);
}

const engineControlLines = lines.slice(engineStartLine, engineEndLine + 1);

// Now, remove the Engine Control lines AND the closing/opening tags of the md:col-span-2
// We want to remove from engineStartLine to the line BEFORE {/* Active Trading Slots */}
const removeStart = engineStartLine;
const removeEnd = engineEndLine + 4; // This removes up to line 2114: <div className="md:col-span-2 flex flex-col gap-6">

// Where to insert Engine Control?
// Under Terminal Logs.
// Terminal Logs ends here:
// 1335:                 ))}
// 1336:               </div>
// 1337:             </div>
// 1338:           </div>
// 1339: 
// 1340:           {/* Main Content Column */}
let insertLine = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{/* Main Content Column */}')) {
        // Find the first occurrence
        insertLine = i - 1; // Insert before </div> at 1338
        break;
    }
}

console.log("Extracting Engine Control from", removeStart, "to", removeEnd);
console.log("Inserting at", insertLine);

// Build new lines
let newLines = [];
for (let i = 0; i < lines.length; i++) {
    if (i === insertLine) {
        newLines.push(...engineControlLines);
        // Add a gap maybe?
        // No, engineControlLines already has its own margin/padding.
    }
    
    if (i >= removeStart && i <= removeEnd) {
        continue; // Skip these lines
    }
    
    newLines.push(lines[i]);
}

fs.writeFileSync(filepath, newLines.join('\n'));
console.log("Done");
