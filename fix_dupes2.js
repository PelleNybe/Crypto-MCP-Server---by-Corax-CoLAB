const fs = require('fs');
let lines = fs.readFileSync('gui/backend/server.js', 'utf8').split('\n');
let inOrderDryRun = false;
let inOrderPending = false;
let newLines = [];
let seenAllowedSides = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.includes('app.post(\'/api/order/dry_run\'')) {
        inOrderDryRun = true;
        seenAllowedSides = false;
    } else if (line.includes('app.post(\'/api/order/execute\'')) {
        inOrderDryRun = false;
    } else if (line.includes('app.post(\'/api/order/pending\'')) {
        inOrderPending = true;
        seenAllowedSides = false;
    } else if (line.includes('app.post(\'/api/order/approve\'')) {
        inOrderPending = false;
    }

    if (inOrderDryRun || inOrderPending) {
        if (line.includes('const allowedSides = ')) {
            if (seenAllowedSides) {
                // skip next 11 lines which is the duplicated block
                i += 11;
                continue;
            }
            seenAllowedSides = true;
        }
    }

    newLines.push(line);
}

fs.writeFileSync('gui/backend/server.js', newLines.join('\n'));
