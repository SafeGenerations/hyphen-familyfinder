#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define the correct import mappings based on your file structure
const importFixes = {
  // Fix GenogramCanvas imports
  'src-modern/components/Canvas/GenogramCanvas.js': {
    "from '../../GridBackground'": "from '../UI/GridBackground'",
    "from './GridBackground'": "from '../UI/GridBackground'"
  },
  
  // Fix ModernGenogramApp imports
  'src-modern/ModernGenogramApp.js': {
    "from './PromoSidebar'": "from './components/UI/PromoSidebar'",
    "from './GuidedTour'": "from './components/UI/GuidedTour'",
    "from './Feedback'": "from './components/UI/Feedback'",
    "from './HelpButton'": "from './components/UI/HelpButton'",
    "from './promoConfig'": "from './config/promoConfig'"
  }
};

// Function to fix imports in a file
function fixImportsInFile(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const [search, replace] of Object.entries(replacements)) {
      if (content.includes(search)) {
        content = content.replace(new RegExp(search, 'g'), replace);
        modified = true;
        console.log(`✓ Fixed: ${search} → ${replace}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Updated: ${filePath}\n`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

// Fix imports based on mappings
for (const [file, replacements] of Object.entries(importFixes)) {
  console.log(`Processing: ${file}`);
  fixImportsInFile(file, replacements);
}

// Also check for any remaining issues with relative paths
console.log('\nChecking for additional import issues...\n');

// Function to scan all JS files for import issues
function scanForImportIssues(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanForImportIssues(filePath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const importRegex = /from ['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        // Check if it's a relative import
        if (importPath.startsWith('.')) {
          const resolvedPath = path.resolve(path.dirname(filePath), importPath);
          const jsPath = resolvedPath.endsWith('.js') ? resolvedPath : `${resolvedPath}.js`;
          
          if (!fs.existsSync(jsPath)) {
            console.log(`⚠️  Missing import in ${filePath}:`);
            console.log(`   "${importPath}" not found`);
            console.log(`   Expected at: ${jsPath}\n`);
          }
        }
      }
    }
  });
}

scanForImportIssues('src-modern');

console.log('Import fix scan complete!');