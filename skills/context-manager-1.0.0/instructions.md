# Context Manager - AI Assistant Instructions

This skill provides a standardized workflow for managing conversation context when usage approaches limits.

## Core Workflow

### 1. Periodic Monitoring
- **When**: Every 5-10 minutes during active conversation, or when user mentions slow performance
- **Action**: Use `session_status` to check current usage
- **Threshold Check**:
  - <85%: Continue normally
  - 85-90%: Notify user, suggest cleanup
  - >90%: Recommend immediate cleanup

### 2. User Notification
When usage exceeds warning threshold (85%):
```
当前上下文使用率 {percent}% ({used}/{total} tokens)，建议进行整理。
是否需要开始上下文整理？(回复"开始上下文整理")
```

### 3. Cleanup Process (User Approved)

#### Step 1: Get Conversation History
```javascript
// Use sessions_history to get recent messages
sessions_history({
  sessionKey: currentSession,
  limit: 50  // Adjust based on usage
})
```

#### Step 2: Generate Summary
Extract key information:
- **Decisions**: Important choices made
- **TODOs**: Open tasks and next steps
- **User Preferences**: Stated preferences and habits
- **Important Facts**: Critical information
- **Project Context**: Current project state
- **Next Steps**: Immediate actions needed

#### Step 3: Save Summary File
- **Location**: `memory/context-summary-YYYY-MM-DD-HHMM.md`
- **Format**: Use template from config.json
- **Metadata**: Include original token count, reduction percentage

#### Step 4: Create New Session
```javascript
sessions_spawn({
  task: "Continue previous conversation with context summary",
  label: "Context-resumed",
  runtime: "subagent",
  // Include summary file as context
})
```

#### Step 5: Load Summary in New Session
- Read summary file
- Provide context to user
- Continue conversation seamlessly

## Manual Commands for Users

Teach users these natural language commands:

1. **"查一下上下文还剩多少"** - Check current usage
2. **"开始上下文整理"** - Start cleanup process
3. **"读取总结继续"** - Load summary and continue

## Automated Triggers

### Heartbeat Integration
Add to HEARTBEAT.md:
```markdown
## Context Management
- Check context usage every 30 minutes
- If >85%, notify user
- Record checks in memory/heartbeat-state.json
```

### Before Large Operations
Before starting tasks that will generate lots of context:
1. Check current usage
2. If >70%, suggest preemptive cleanup
3. Save current state as checkpoint

## Example Dialog

**User**: 查一下上下文还剩多少
**AI**: (checks) 当前使用率 87% (28.7k/33k tokens)，建议整理。是否开始上下文整理？
**User**: 开始上下文整理
**AI**: 正在整理... (performs steps 1-3)
**AI**: 整理完成，总结已保存到 memory/context-summary-2026-03-31-0030.md
**AI**: 请说"读取总结继续"以加载总结并继续对话
**User**: 读取总结继续
**AI**: (loads summary, creates new session) 总结已加载，我们继续...

## Configuration Adjustments

Based on user feedback:
- **Sensitive users**: Lower warning threshold to 80%
- **Technical users**: Increase to 90% warning, 95% critical
- **Long tasks**: Enable auto-check every 2 minutes during intensive work

## Integration with Other Skills

### memory-manager
- Save important context to long-term memory
- Cross-reference with existing memories

### cross-model-memory
- Ensure summaries are accessible across model switches
- Update MEMORY.md with significant learnings

### self-improving
- Learn which information is most valuable to preserve
- Optimize summary generation over time

## Troubleshooting

### Issue: User doesn't see summary
**Solution**: Read summary file aloud, highlight key points

### Issue: New session loses context
**Solution**: Include more detail in summary, preserve conversation flow

### Issue: Frequent cleanups needed
**Solution**: 
1. Adjust thresholds higher
2. Teach user to be more concise
3. Use bullet points instead of long paragraphs

## Performance Metrics

Track:
- Average tokens before cleanup
- Summary compression ratio
- User satisfaction with continuity
- Time saved by avoiding context overflow

---
**Goal**: Extend effective conversation length while maintaining natural flow.