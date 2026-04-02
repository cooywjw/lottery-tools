# Skill 迁移指南

将现有的 OpenClaw Skill 迁移到 Claude Tool Interface 规范。

## 迁移步骤

### Step 1: 识别现有 Skill 结构

检查现有 Skill 的 `SKILL.md`：

```yaml
name: my-skill
description: "我的技能"
```

对照新接口需要补充：
- [ ] `inputSchema`（Zod 定义）
- [ ] `isConcurrencySafe()`（读=true，写=false）
- [ ] `isReadOnly()`（是否只读）
- [ ] `isEnabled()`（功能开关）
- [ ] `description()`（动态描述，可选）
- [ ] `renderResult()`（UI渲染，可选）

### Step 2: 创建 Schema 定义

从现有参数提取 Zod schema：

**Before（SKILL.md 描述）：**
```
参数：
- query: 搜索关键词（必填）
- limit: 返回数量（可选，默认10）
```

**After（Zod Schema）：**
```typescript
import { z } from 'zod'

const inputSchema = z.object({
  query: z.string().describe('搜索关键词'),
  limit: z.number().int().min(1).max(100).optional().default(10),
})
```

### Step 3: 实现能力判断

```typescript
// 搜索是只读+可并发的
isConcurrencySafe: (input) => true,
isReadOnly: () => true,
isEnabled: () => true,

// 如果有破坏性操作
isDestructive: (input) => input.mode === 'delete',
```

### Step 4: 更新 SKILL.md

在 SKILL.md 中添加新章节：

```markdown
## Claude Tool Interface

### inputSchema
- `query` (string, 必填): 搜索关键词
- `limit` (number, 可选): 返回数量，默认10

### 能力标记
- 并发安全: ✅ 是
- 只读: ✅ 是
- 破坏性: ❌ 否
```

---

## 实战：迁移 context-manager

### 当前状态

现有 `context-manager` SKILL.md：
- 有 `description`（静态字符串）
- 无 `inputSchema`
- 无 `isConcurrencySafe`/`isReadOnly` 等

### 迁移后

#### 1. 定义 Schema

```typescript
// 迁移后的 schema
const inputSchema = z.object({
  action: z.enum(['check', 'summarize', 'reset']).describe('操作类型'),
  threshold: z.number().min(0).max(1).optional().describe('压缩阈值'),
  force: z.boolean().optional().describe('强制执行'),
})
```

#### 2. 能力判断

```typescript
isConcurrencySafe: (input) => input.action === 'check',
// check 只是读，summarize/reset 是写

isReadOnly: (input) => input.action === 'check',
// check 不修改任何内容

isDestructive: (input) => input.action === 'reset',
// reset 是破坏性操作

isEnabled: () => true,
```

#### 3. 动态描述

```typescript
description: (input, { isNonInteractive }) => {
  switch (input.action) {
    case 'check':
      return 'Check current context usage percentage'
    case 'summarize':
      return 'Summarize conversation and create new session'
    case 'reset':
      return isNonInteractive
        ? 'Reset session (DESTRUCTIVE - cannot be undone)'
        : 'Reset session after user confirmation'
  }
}
```

---

## 常见问题

### Q: 现有 Skill 没有 inputSchema，怎么迁移？

A: 从 SKILL.md 的参数描述中提取，手动定义 Zod schema。

### Q: `call()` 已经实现了逻辑，还要重写吗？

A: **不要**。迁移重点是补充**接口元数据**（schema、能力判断、描述），不是重写 `call()` 逻辑。

### Q: 如何处理嵌套对象参数？

A: 使用 Zod 的嵌套：

```typescript
z.object({
  options: z.object({
    depth: z.number(),
    includeMetadata: z.boolean(),
  }),
})
```

### Q: 迁移后对现有功能有影响吗？

A: **无影响**。迁移只是增强元数据，不改变 `call()` 的执行逻辑。OpenClaw 仍然按原方式调用 Skill。
