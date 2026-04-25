const fs = require('fs');

const appFile = 'gui/frontend/src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

const imports = `
import DarkPoolSonar from './components/features/DarkPoolSonar'
import FlashCrashMatrix from './components/features/FlashCrashMatrix'
import GalaxyView from './components/features/GalaxyView'
import SentimentWordCloud from './components/features/SentimentWordCloud'
import GasHologram from './components/features/GasHologram'
`;

content = content.replace("import OrbitalPortfolio from './components/features/OrbitalPortfolio';", "import OrbitalPortfolio from './components/features/OrbitalPortfolio';" + imports);

const featuresCode = `
        {/* NEW WORLD CLASS FEATURES */}
        <DarkPoolSonar />
        <FlashCrashMatrix />
        <GalaxyView />
        <SentimentWordCloud />
        <GasHologram />
`;

content = content.replace("        <ArbitrageWormhole />", featuresCode + "\n        <ArbitrageWormhole />");

fs.writeFileSync(appFile, content);
