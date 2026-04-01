#!/usr/bin/env node

/**
 * Example workflow demonstrating context management
 * 
 * This is a reference implementation showing how the AI assistant
 * should use the context manager skill in practice.
 */

const fs = require('fs');
const path = require('path');
const utils = require('./context-utils');

console.log('=== Context Manager Example Workflow ===\n');

// Simulate checking context usage (in real usage, AI uses session_status)
const simulatedUsage = 0.87; // 87%

console.log('1. Checking context usage...');
const status = utils.checkThresholds(simulatedUsage);
console.log(JSON.stringify(status, null, 2));

if (status.isWarning) {
  console.log('\n2. Warning threshold exceeded. User should be notified:');
  console.log(`   当前上下文使用率 ${Math.round(simulatedUsage * 100)}%，建议进行整理。`);
  console.log(`   是否需要开始上下文整理？(回复"开始上下文整理")\n`);
  
  // Simulate user approval
  const userApproved = true;
  
  if (userApproved) {
    console.log('3. User approved cleanup. Starting process...');
    
    // Generate summary filename
    const filename = utils.getSummaryFilename();
    const summaryDir = utils.ensureSummaryDir();
    const summaryPath = path.join(summaryDir, filename);
    
    console.log(`   Summary file: ${summaryPath}\n`);
    
    // Create example summary (in real usage, AI generates from conversation)
    const exampleSummary = `# Context Summary - ${new Date().toISOString()}

## Key Decisions
- User decided to develop context manager skill
- Chose Node.js implementation over Python
- Set warning threshold at 85%, critical at 90%

## Open TODOs
- [ ] Test complete workflow
- [ ] Update AGENTS.md with new skill
- [ ] Teach user the new commands

## User Preferences
- Prefers concise, step-by-step instructions
- Wants natural language commands (no buttons)
- Technical level: intermediate

## Important Information
- Current project: Context manager skill development
- Workspace: ~/.openclaw/workspace
- User: Lottery shop owner in Suzhou

## Next Steps
1. Complete skill testing
2. Document usage examples
3. Integrate with heartbeat checks

## Conversation Flow
Discussed context limitations, designed solution, started implementation.
Now at 78% usage, developing skill structure.

---
**Original Context**: 26000 tokens
**Summary**: 500 tokens
**Reduction**: 98%
**Session ID**: agent:main:feishu:direct:ou_1b35a7e08c18ad9df24f0491eb2f06e6`;
    
    // Save summary
    fs.writeFileSync(summaryPath, exampleSummary, 'utf8');
    console.log('   Summary saved successfully.\n');
    
    console.log('4. Ready for new session. Instructions for AI:');
    console.log('   - Use sessions_spawn to create new session');
    console.log('   - Load summary file:', summaryPath);
    console.log('   - Continue conversation from summary\n');
    
    console.log('5. Cleanup old summaries...');
    utils.cleanupOldSummaries();
    
  } else {
    console.log('3. User declined cleanup. Continue monitoring.');
  }
} else {
  console.log('\n2. Usage normal. Continue conversation.');
}

console.log('\n=== Workflow Complete ===');
console.log('\nCommands to teach user:');
console.log('- "查一下上下文还剩多少" - Check usage');
console.log('- "开始上下文整理" - Start cleanup');
console.log('- "读取总结继续" - Load summary and continue');