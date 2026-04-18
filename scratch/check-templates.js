const fs = require('fs');
const path = require('path');

const widgetsDir = path.join('src', 'app', 'features', 'self-service', 'ess-dashboard', 'widgets');
const files = fs.readdirSync(widgetsDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(widgetsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Simple check for tag balance in templates
  const templateMatch = content.match(/template:\s*`([\s\S]*?)`/);
  if (templateMatch) {
    const template = templateMatch[1];
    const tags = [];
    const re = /<\/?([a-z0-9-]+)/gi;
    let match;
    while ((match = re.exec(template)) !== null) {
      const tag = match[1].toLowerCase();
      if (match[0].startsWith('</')) {
        if (tags.length === 0 || tags[tags.length - 1] !== tag) {
          console.error(`Mismatch in ${file}: unexpected closing tag </${tag}>`);
        } else {
          tags.pop();
        }
      } else {
        // Ignore self-closing tags like <img/>, <br/>, <hr/>, <input/>
        if (!['img', 'br', 'hr', 'input', 'link', 'meta'].includes(tag)) {
          tags.push(tag);
        }
      }
    }
    if (tags.length > 0) {
      console.error(`Mismatch in ${file}: unclosed tags [${tags.join(', ')}]`);
    }

    // Check for @if/@for block balance
    const blocks = [];
    const blockRe = /(@(if|for|switch|case|default|else)|{|} )/g; // Simplified
    // Angular blocks use { }
    let braceCount = 0;
    const braces = (template.match(/{|}/g) || []).length;
    // This is hard to regex perfectly, but let's look for @if/@for and corresponding { }
    const blockMatches = template.match(/@(if|for|switch|case|default|else|empty)/g) || [];
    const openingBraces = (template.match(/{/g) || []).length;
    const closingBraces = (template.match(/}/g) || []).length;
    if (openingBraces !== closingBraces) {
      console.error(`Mismatch in ${file}: brace imbalance {:${openingBraces} }:${closingBraces}`);
    }
  }
});
