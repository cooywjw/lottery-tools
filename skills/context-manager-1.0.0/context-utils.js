#!/usr/bin/env node

/**
 * Context Manager Utilities
 * 
 * Provides helper functions for context monitoring and management.
 * This script is called by the AI assistant via exec tool.
 */

const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

/**
 * Check if context usage exceeds thresholds
 * @param {number} usagePercent - Current context usage (0-1)
 * @returns {Object} Status object
 */
function checkThresholds(usagePercent) {
  return {
    usagePercent,
    warningThreshold: config.warningThreshold,
    criticalThreshold: config.criticalThreshold,
    isWarning: usagePercent >= config.warningThreshold,
    isCritical: usagePercent >= config.criticalThreshold,
    recommendation: usagePercent >= config.criticalThreshold 
      ? 'Immediate cleanup recommended' 
      : usagePercent >= config.warningThreshold 
        ? 'Consider cleanup soon' 
        : 'Normal usage'
  };
}

/**
 * Generate summary file name with timestamp
 * @returns {string} File name
 */
function getSummaryFilename() {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
  return `context-summary-${dateStr}-${timeStr}.md`;
}

/**
 * Ensure summary directory exists
 */
function ensureSummaryDir() {
  const summaryDir = path.join(process.cwd(), config.summaryDir);
  if (!fs.existsSync(summaryDir)) {
    fs.mkdirSync(summaryDir, { recursive: true });
  }
  return summaryDir;
}

/**
 * Get list of recent summaries
 * @param {number} limit - Maximum summaries to return
 * @returns {Array} List of summary file paths
 */
function getRecentSummaries(limit = config.maxSummariesToKeep) {
  const summaryDir = path.join(process.cwd(), config.summaryDir);
  if (!fs.existsSync(summaryDir)) {
    return [];
  }
  
  const files = fs.readdirSync(summaryDir)
    .filter(f => f.startsWith('context-summary-') && f.endsWith('.md'))
    .map(f => ({
      name: f,
      path: path.join(summaryDir, f),
      time: fs.statSync(path.join(summaryDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time)
    .slice(0, limit);
    
  return files;
}

/**
 * Clean up old summaries beyond limit
 */
function cleanupOldSummaries() {
  const summaries = getRecentSummaries(config.maxSummariesToKeep * 2);
  if (summaries.length > config.maxSummariesToKeep) {
    const toDelete = summaries.slice(config.maxSummariesToKeep);
    toDelete.forEach(file => {
      try {
        fs.unlinkSync(file.path);
        console.log(`Deleted old summary: ${file.name}`);
      } catch (err) {
        console.error(`Failed to delete ${file.name}:`, err.message);
      }
    });
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Context Manager Utilities');
    console.log('Usage:');
    console.log('  node context-utils.js --check <usagePercent>');
    console.log('  node context-utils.js --filename');
    console.log('  node context-utils.js --list');
    console.log('  node context-utils.js --cleanup');
    process.exit(0);
  }
  
  const command = args[0];
  
  switch (command) {
    case '--check':
      if (args.length < 2) {
        console.error('Usage: node context-utils.js --check <usagePercent>');
        process.exit(1);
      }
      const usagePercent = parseFloat(args[1]);
      if (isNaN(usagePercent) || usagePercent < 0 || usagePercent > 100) {
        console.error('Usage percent must be between 0 and 100');
        process.exit(1);
      }
      const status = checkThresholds(usagePercent / 100);
      console.log(JSON.stringify(status, null, 2));
      break;
      
    case '--filename':
      ensureSummaryDir();
      console.log(getSummaryFilename());
      break;
      
    case '--list':
      ensureSummaryDir();
      const summaries = getRecentSummaries();
      console.log(JSON.stringify(summaries.map(f => f.name), null, 2));
      break;
      
    case '--cleanup':
      ensureSummaryDir();
      cleanupOldSummaries();
      console.log('Cleanup completed');
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

// Export for module usage
module.exports = {
  checkThresholds,
  getSummaryFilename,
  ensureSummaryDir,
  getRecentSummaries,
  cleanupOldSummaries,
  config
};