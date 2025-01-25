const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if node_modules exists
const checkDependencies = () => {
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('\n⚠️  node_modules not found. Installing dependencies...');
    try {
      execSync('pnpm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed successfully!\n');
    } catch (error) {
      console.error('❌ Failed to install dependencies. Please run "pnpm install" manually.');
      process.exit(1);
    }
  }
};

// Get git hash with fallback
const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'development';
  }
};

// Get package version with fallback
const getPackageVersion = () => {
  try {
    const packageJson = require('./package.json');
    return packageJson.version || '0.0.1';
  } catch {
    return '0.0.1';
  }
};

// Main execution
try {
  // Run pre-start checks
  checkDependencies();

  const commitInfo = {
    hash: getGitHash(),
    version: getPackageVersion(),
  };

  console.log(`
★═══════════════════════════════════════★
          S R U B A
         🔧  Welcome  🔧
★═══════════════════════════════════════★
`);
  console.log('📍 Current Version:', `v${commitInfo.version}`);
  console.log('📍 Git Commit:', commitInfo.hash);
  console.log('  Starting development server...');
  console.log('★═══════════════════════════════════════★\n');

} catch (error) {
  console.error('❌ Error during startup:', error.message);
  process.exit(1);
}
