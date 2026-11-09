import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname;
const artifactDir = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\2b797227-fae5-498b-b692-38c294b015a4';

function addFolderToZip(zip, folderPath, zipBasePath = '') {
  const items = fs.readdirSync(folderPath);
  for (const item of items) {
    const fullPath = path.join(folderPath, item);
    const stat = fs.statSync(fullPath);
    const zipPath = zipBasePath ? `${zipBasePath}/${item}` : item;

    if (stat.isDirectory()) {
      addFolderToZip(zip, fullPath, zipPath);
    } else {
      zip.file(zipPath, fs.readFileSync(fullPath));
    }
  }
}

async function buildZips() {
  console.log('Building GitHub deployment packages...');

  // 1. BUILD SOURCE ZIP (Clean GitHub Repository Package)
  const sourceZip = new JSZip();

  // Add directories
  addFolderToZip(sourceZip, path.join(projectRoot, 'src'), 'src');
  addFolderToZip(sourceZip, path.join(projectRoot, 'public'), 'public');
  if (fs.existsSync(path.join(projectRoot, '.github'))) {
    addFolderToZip(sourceZip, path.join(projectRoot, '.github'), '.github');
  }

  // Add individual root files
  const rootFiles = [
    '.gitignore',
    'index.html',
    'package.json',
    'package-lock.json',
    'vercel.json',
    'README.md',
    'vite.config.js',
    'start.bat',
    'deploy-to-vercel.bat',
    'serve-dist.mjs',
    'test-milestone1.mjs',
    'test-milestone2.mjs',
    'test-milestone3.mjs',
    'test-milestone4.mjs',
    'test-milestone5.mjs',
    'test-milestone6.mjs',
    'test-additional-pdf-to-word.mjs',
    'test-dark-theme.mjs',
    'test-merge-robustness.mjs',
    'test-stamp-export.mjs'
  ];

  for (const file of rootFiles) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      sourceZip.file(file, fs.readFileSync(filePath));
    }
  }

  console.log('Generating pdf-studio-source-github.zip...');
  const sourceBuffer = await sourceZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  const sourceZipPath = path.join(projectRoot, 'pdf-studio-source-github.zip');
  fs.writeFileSync(sourceZipPath, sourceBuffer);
  // Also copy to artifact dir so user can access it directly
  fs.writeFileSync(path.join(artifactDir, 'pdf-studio-source-github.zip'), sourceBuffer);
  console.log(`✓ Created pdf-studio-source-github.zip (${(sourceBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);

  // 2. BUILD COMPILED PRODUCTION DIST ZIP (Ready for GitHub Pages / Static Hosting)
  const distZip = new JSZip();
  addFolderToZip(distZip, path.join(projectRoot, 'dist'), '');

  console.log('Generating pdf-studio-compiled-dist.zip...');
  const distBuffer = await distZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  const distZipPath = path.join(projectRoot, 'pdf-studio-compiled-dist.zip');
  fs.writeFileSync(distZipPath, distBuffer);
  fs.writeFileSync(path.join(artifactDir, 'pdf-studio-compiled-dist.zip'), distBuffer);
  console.log(`✓ Created pdf-studio-compiled-dist.zip (${(distBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);

  console.log('\nDeployment packages generated successfully!');
}

buildZips().catch(err => {
  console.error('Failed to create zips:', err);
  process.exit(1);
});

