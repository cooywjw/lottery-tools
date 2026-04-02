# Claude Tool Interface

统一工具接口规范，让 OpenClaw Skills 具备 Claude Code Tool 级别的结构化能力。

## 核心接口

每个符合规范的 Tool 包含以下核心字段：

```typescript
type OpenClawTool<Input, Output> = {
  // === 身份 ===
  name: string                    // 唯一名称
  aliases?: string[]             // 别名
  searchHint?: string            // 3-10词能力描述（用于ToolSearch）

  // === Schema（关键！）===
  inputSchema: z.ZodType<Input>  // Zod 输入验证
  outputSchema?: z.ZodType<Output> // 输出验证（可选）

  // === 执行（核心）===
  call(
    args: Input,
    context: ToolContext,
    canUseTool: (tool: string) => Promise<boolean>,
    onProgress?: (p: Progress) => void
  ): Promise<ToolResult<Output>>

  // === 动态描述 ===
  description(
    input: Input,
    options: { isNonInteractive: boolean }
  ): Promise<string>

  // === 能力判断 ===
  isConcurrencySafe(input: Input): boolean   // 能否并发（读操作=true）
  isReadOnly(input: Input): boolean           // 是否只读
  isDestructive?(input: Input): boolean      // 是否破坏性
  isEnabled(): boolean                         // 功能开关

  // === UI渲染（可选）===
  renderResult?(output: Output): string | ReactNode

  // === 元数据 ===
  maxResultSizeChars?: number   // 默认10000，超限存文件
}
```

### ToolContext（执行上下文）

```typescript
interface ToolContext {
  abortController?: AbortController
  workingDirectory?: string    // 当前工作目录
  sessionId?: string
  userId?: string
  canUseTool: (tool: string) => Promise<boolean>  // 权限检查
  getState?: () => Record<string, unknown>
}
```

### ToolResult（执行结果）

```typescript
interface ToolResult<T> {
  data: T
  error?: string
  newMessages?: Message[]   // 可选：新增消息
}
```

---

## 能力判断规则

### isConcurrencySafe（能否并发）

- `true`：读操作，可多个同时执行
- `false`：写操作，必须串行

```
Bash(readonly cmd)     → true
Bash(write cmd)        → false
FileRead              → true
FileEdit              → false
WebSearch             → true
TavilySearch          → true
WechatPublish         → false
```

### isReadOnly（是否只读）

- `true`：不修改任何文件/状态
- `false`：会修改文件、发送消息、触发外部操作

### isDestructive（是否破坏性）

- `true`：删除、覆盖、不可逆操作
- 未定义：非破坏性

---

## 描述生成规则

`description()` 应根据输入返回不同描述：

```typescript
// 好的例子
description: (input) => {
  if (input.mode === 'delete') {
    return 'Delete a task by ID. Cannot be undone.'
  }
  return 'Create a new task with the given title.'
}

// 坏的例子（静态描述）
description: 'Manage tasks'  // 太模糊
```

---

## 结果大小管理

`maxResultSizeChars` 控制单次结果上限：

- 默认：`10000` 字符
- 超出：OpenClaw 自动存文件，返回路径而非内容
- 设为 `Infinity`：永不限流（如 Read 工具）

---

## 进度回调（onProgress）

对于长时间操作，通过 `onProgress` 报告进度：

```typescript
onProgress?.({
  type: 'progress',
  message: 'Processing...',
  percent: 50
})
```

---

## 文件结构

```
claude-tool-interface/
├── SKILL.md              # 本文件
├── SCHEMA.md             # TypeScript 接口定义
├── REGISTRY.md           # 工具注册规范
├── MIGRATION_GUIDE.md    # 从旧Skill迁移指南
└── TOOL_TEMPLATE.md      # 新工具创建模板
```

## 相关文件

- `D:\work\projects\claude-code-source\PHASE1_TOOL_SCHEMA.md` — 详细设计文档（含Claude Code源码对照）
