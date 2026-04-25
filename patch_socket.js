const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("import io from 'socket.io-client'\n", "import socket from '../socket'\n");

  if (file.includes('OrdersLogPanel')) {
    content = content.replace(/const socket = io\([^)]*\)/g, ""); // Remove local socket definition
  } else if (file.includes('PortfolioPanel')) {
     content = content.replace(/const socket = io\([^)]*\)/g, "");
  } else if (file.includes('TickerPanel')) {
     content = content.replace(/const socket = io\([^)]*\)/g, "");
  }

  fs.writeFileSync(file, content);
}

patchFile('gui/frontend/src/components/TickerPanel.tsx');
patchFile('gui/frontend/src/components/OrdersLogPanel.tsx');
patchFile('gui/frontend/src/components/PortfolioPanel.tsx');
