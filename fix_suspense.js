const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files in the admin app
const files = glob.sync('apps/admin/src/app/**/*.tsx');

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file uses useSearchParams but doesn't have Suspense
  if (content.includes('useSearchParams') && !content.includes('Suspense')) {
    console.log(`Fixing: ${filePath}`);
    
    let newContent = content;
    
    // Add Suspense import if not present
    if (content.includes("import { useState, useEffect }")) {
      newContent = newContent.replace(
        "import { useState, useEffect }",
        "import { useState, useEffect, Suspense }"
      );
    } else if (content.includes("import { useState }")) {
      newContent = newContent.replace(
        "import { useState }",
        "import { useState, Suspense }"
      );
    } else if (content.includes("import { useEffect }")) {
      newContent = newContent.replace(
        "import { useEffect }",
        "import { useEffect, Suspense }"
      );
    } else if (content.includes("import React")) {
      newContent = newContent.replace(
        "import React",
        "import React, { Suspense }"
      );
    }
    
    // Find the main component export
    const exportMatch = newContent.match(/export default function (\w+)\(/);
    if (exportMatch) {
      const componentName = exportMatch[1];
      const contentComponentName = componentName + 'Content';
      
      // Rename the main component
      newContent = newContent.replace(
        `export default function ${componentName}(`,
        `function ${contentComponentName}(`
      );
      
      // Add the new wrapper component at the end
      const lastBraceIndex = newContent.lastIndexOf('}');
      const beforeLastBrace = newContent.substring(0, lastBraceIndex);
      const afterLastBrace = newContent.substring(lastBraceIndex);
      
      newContent = beforeLastBrace + `}

export default function ${componentName}() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <${contentComponentName} />
    </Suspense>
  );
` + afterLastBrace;
    }
    
    // Write the fixed content back
    fs.writeFileSync(filePath, newContent);
  }
});

console.log('Fixed all useSearchParams Suspense boundary issues!'); 


