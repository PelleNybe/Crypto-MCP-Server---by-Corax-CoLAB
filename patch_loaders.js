const fs = require('fs');

function addLoader(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('CyberpunkLoader')) {
      content = content.replace(/import React, { useState, useEffect } from 'react'/g, "import React, { useState, useEffect } from 'react'\nimport CyberpunkLoader from './CyberpunkLoader'");
  }

  if (filePath.includes('PortfolioPanel')) {
      // Find return statement and insert loader if data is empty/loading
      content = content.replace(
        "return (\n    <div className=\"card interactive-element\">",
        "return (\n    <div className=\"card interactive-element\">\n      {!data ? <CyberpunkLoader message=\"Syncing Assets...\" /> :\n      <>\n"
      );
      content = content.replace(/<\/div>\n  \)/g, "      </>\n      }\n    </div>\n  )");
  }

  if (filePath.includes('TickerPanel')) {
      content = content.replace(
        "return (\n    <div className=\"card interactive-element\">",
        "return (\n    <div className=\"card interactive-element\">\n      {!ticker ? <CyberpunkLoader message=\"Listening to Orderbook...\" /> :\n      <>\n"
      );
      content = content.replace(/<\/div>\n  \)/g, "      </>\n      }\n    </div>\n  )");
  }

  fs.writeFileSync(filePath, content);
}

addLoader('gui/frontend/src/components/PortfolioPanel.tsx');
addLoader('gui/frontend/src/components/TickerPanel.tsx');
