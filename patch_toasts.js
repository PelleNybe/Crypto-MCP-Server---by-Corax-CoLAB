const fs = require('fs');

function wrapAppWithProvider() {
  const mainFile = 'gui/frontend/src/main.tsx';
  let content = fs.readFileSync(mainFile, 'utf8');
  if (!content.includes('ToastProvider')) {
    content = content.replace("import App from './App'", "import App from './App'\nimport { ToastProvider } from './components/NeonToasts'");
    content = content.replace("<App />", "<ToastProvider><App /></ToastProvider>");
    fs.writeFileSync(mainFile, content);
  }
}

function addToastUsage() {
    const file = 'gui/frontend/src/components/OrderPanel.tsx';
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('useToast')) {
        content = content.replace("import React, { useState } from 'react'", "import React, { useState } from 'react'\nimport { useToast } from './NeonToasts'");
        content = content.replace("export default function OrderPanel() {\n", "export default function OrderPanel() {\n  const { addToast } = useToast();\n");
        content = content.replace(/alert\((.*)\)/g, (match, p1) => `addToast(${p1}, 'info')`);

        // Basic error/success toast updates
        content = content.replace("addToast('Preview Error: ' + err.message, 'info')", "addToast('Preview Error: ' + err.message, 'error')");
        content = content.replace("addToast('Order placed successfully!', 'info')", "addToast('Order placed successfully!', 'success')");
        content = content.replace("addToast('Order failed: ' + res.error, 'info')", "addToast('Order failed: ' + res.error, 'error')");
        content = content.replace("addToast('Execute Error: ' + err.message, 'info')", "addToast('Execute Error: ' + err.message, 'error')");

        fs.writeFileSync(file, content);
    }
}

wrapAppWithProvider();
addToastUsage();
