const fs = require('fs');

function addGlitch(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('glitchKey')) {
        content = content.replace("export default function PortfolioPanel() {", "export default function PortfolioPanel() {\n  const [glitchKey, setGlitchKey] = useState(0);");
        content = content.replace("setData(data.data);", "setData(data.data);\n        setGlitchKey(prev => prev + 1);");
        content = content.replace("style={{ fontSize: 24, fontWeight: 'bold'", "key={glitchKey} className=\"glitch-update\" style={{ fontSize: 24, fontWeight: 'bold'");
        fs.writeFileSync(filePath, content);
    }
}

addGlitch('gui/frontend/src/components/PortfolioPanel.tsx');
