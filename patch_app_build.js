const fs = require('fs');

const file = 'gui/frontend/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
"if (taData.signal === 'buy') setSentiment('bull');\n                document.body.setAttribute('data-sentiment', 'bull');\n                else if (taData.signal === 'sell') setSentiment('bear');\n                document.body.setAttribute('data-sentiment', 'bear');\n                else setSentiment('neutral');\n                document.body.setAttribute('data-sentiment', 'neutral');",
`if (taData.signal === 'buy') { setSentiment('bull'); document.body.setAttribute('data-sentiment', 'bull'); }
                else if (taData.signal === 'sell') { setSentiment('bear'); document.body.setAttribute('data-sentiment', 'bear'); }
                else { setSentiment('neutral'); document.body.setAttribute('data-sentiment', 'neutral'); }`
);

fs.writeFileSync(file, content);
