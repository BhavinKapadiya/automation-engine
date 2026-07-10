const fs = require('fs');
const path = require('path');

function convert() {
  const localMd = 'original_vs_proposed_5_products.md';
  const localTxt = 'original_vs_proposed_5_products.txt';
  
  if (!fs.existsSync(localMd)) {
    console.error(`Error: ${localMd} not found.`);
    return;
  }
  
  let content = fs.readFileSync(localMd, 'utf8');
  
  // Convert tables to a readable text representation
  content = content.replace(/<\/tr>/gi, '\n');
  content = content.replace(/<\/td>\s*<td[^>]*>/gi, ' : ');
  content = content.replace(/<\/th>\s*<th[^>]*>/gi, ' | ');
  
  // Format FAQ lines to look cleaner in plain text
  content = content.replace(/Q: /g, '\nQ: ');
  content = content.replace(/A: /g, '\nA: ');
  
  // Clean up carousel tags
  content = content.replace(/```carousel/gi, '=================== START COMPARISON ===================\n');
  content = content.replace(/<!-- slide -->/gi, '\n------------------- PROPOSED VERSION -------------------\n');
  content = content.replace(/```/g, '\n=================== END COMPARISON ===================\n');
  
  // Strip all other HTML tags
  content = content.replace(/<[^>]+>/g, '');
  
  // De-duplicate extra newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(localTxt, content);
  console.log(`✅ Saved text version to ${localTxt}`);
  
  // Copy to artifacts folder
  const artifactDir = 'C:\\Users\\Bhavin Kapadiya\\.gemini\\antigravity\\brain\\1c836e4a-8fb0-4ce0-8b23-0b889457605b';
  const artifactTxt = path.join(artifactDir, 'original_vs_proposed_5_products.txt');
  if (fs.existsSync(artifactDir)) {
    fs.writeFileSync(artifactTxt, content);
    console.log(`✅ Saved text version to Artifacts folder: ${artifactTxt}`);
  }
}

convert();
