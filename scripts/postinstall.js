#!/usr/bin/env node

/**
 * Post-install script
 * Creates necessary directories and shows setup instructions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = [
  'data',
  'logs',
  'packages/admin/data',
  'packages/admin/data/versions'
];

console.log('\n📦 Post-install setup...\n');

// Create directories
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Create .gitkeep files
dirs.forEach(dir => {
  const gitkeepPath = path.join(__dirname, '..', dir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
  }
});

console.log('\n✨ Setup complete!\n');

// Show next steps if .env doesn't exist
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('📌 Next steps:');
  console.log('   1. Copy .env.example to .env');
  console.log('   2. Fill in your Telegram Bot tokens and API keys');
  console.log('   3. Run: npm start');
  console.log('');
}
