const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./frontend/src/components');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Dark to Light mappings
  content = content.replace(/background:\s*'#1a1a1a'/g, "background: '#FFFFFF'");
  content = content.replace(/background:\s*'#1e1e1e'/g, "background: '#F8FAFC'");
  content = content.replace(/background:\s*'#222'/g, "background: '#F1F5F9'");
  content = content.replace(/color:\s*'#fff'/g, "color: '#1E293B'");
  content = content.replace(/color:\s*'#e0e0e0'/g, "color: '#0A192F'");
  content = content.replace(/color:\s*'#888'/g, "color: '#64748B'");
  content = content.replace(/border:\s*'1px solid #333'/g, "border: '1px solid #E2E8F0'");
  content = content.replace(/borderBottom:\s*'1px solid #333'/g, "borderBottom: '1px solid #E2E8F0'");

  if(content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
