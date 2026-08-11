import re

with open('gui/frontend/src/components/PortfolioPanel.tsx', 'r') as f:
    content = f.read()

# Import useMemo
content = content.replace("import React, { useEffect, useState, useCallback } from 'react';", "import React, { useEffect, useState, useCallback, useMemo } from 'react';")

# Insert useMemo for sorting
old_state = "  const [dataLoaded, setDataLoaded] = useState(false);"
new_state = """  const [dataLoaded, setDataLoaded] = useState(false);

  // ⚡ Bolt: Memoize the sorted details to prevent O(N log N) sorting on every render
  // and prevent in-place mutation of the details state array.
  const sortedDetails = useMemo(() => {
    return [...details].sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0));
  }, [details]);"""
content = content.replace(old_state, new_state)

# Replace the inline sort
old_render = "{details.sort((a,b)=>(b.value_usd||0)-(a.value_usd||0)).map((d,i)=>("
new_render = "{sortedDetails.map((d,i)=>("
content = content.replace(old_render, new_render)

with open('gui/frontend/src/components/PortfolioPanel.tsx', 'w') as f:
    f.write(content)

print("Patched.")
