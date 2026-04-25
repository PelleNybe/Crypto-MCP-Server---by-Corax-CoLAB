const fs = require('fs');

function addThemeLogic() {
  const filePath = 'gui/frontend/src/App.tsx';
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('document.body.setAttribute')) {
    content = content.replace("setSentiment('bull');", "setSentiment('bull');\n                document.body.setAttribute('data-sentiment', 'bull');");
    content = content.replace("setSentiment('bear');", "setSentiment('bear');\n                document.body.setAttribute('data-sentiment', 'bear');");
    content = content.replace("setSentiment('neutral');", "setSentiment('neutral');\n                document.body.setAttribute('data-sentiment', 'neutral');");

    content = content.replace("onClick={() => setSentiment('bull')}", "onClick={() => { setSentiment('bull'); document.body.setAttribute('data-sentiment', 'bull'); }}");
    content = content.replace("onClick={() => setSentiment('neutral')}", "onClick={() => { setSentiment('neutral'); document.body.setAttribute('data-sentiment', 'neutral'); }}");
    content = content.replace("onClick={() => setSentiment('bear')}", "onClick={() => { setSentiment('bear'); document.body.setAttribute('data-sentiment', 'bear'); }}");

    fs.writeFileSync(filePath, content);
  }
}

addThemeLogic();
