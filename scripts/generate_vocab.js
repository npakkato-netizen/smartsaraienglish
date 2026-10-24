// Script to generate comprehensive 1,000 Secondary Vocabulary dataset (M.1 - M.6)
import fs from 'fs';
import path from 'path';

// Let's create the directory if it doesn't exist
const targetDir = path.resolve(process.cwd(), 'src/data/vocab');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('Target directory ready:', targetDir);
