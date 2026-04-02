# 新工具创建模板

从头创建一个符合 Claude Tool Interface 的 Skill。

## 1. 创建目录结构

```
skills/
└── my-new-tool/
    ├── SKILL.md              # 必需：主文件
    ├── SCHEMA.ts             # 必需：接口定义
    └── README.md             # 可选：使用说明
```

## 2. 编写 SKILL.md

```markdown
---
claude_tool_interface: true
name: my-new-tool
version: 1.0.0
---

# My New Tool

简短描述这个工具做什么。

## 触发词
my-tool, /mytool

## Claude Tool Interface

### inputSchema
- `action` (enum, 必填): 操作类型
  - `read`: 读取数据
  - `write`: 写入数据
  - `delete`: 删除数据
- `path` (string, 条件必填): 当 action 为 read/write/delete 时必填
- `content` (string, 条件必填): 当 action 为 write 时必填

### 能力标记
- 并发安全: ✅ (read) / ❌ (write/delete)
- 只读: ✅ (read only)
- 破坏性: ❌ (read/write) / ✅ (delete)
- 最大结果: 10000 字符

## 使用示例

```
my-tool action=read path=/tmp/test.txt
my-tool action=write path=/tmp/test.txt content=hello
my-tool action=delete path=/tmp/test.txt
```
```

## 3. 编写 SCHEMA.ts

```typescript
import { z } from 'zod'
import type { OpenClawTool, ToolContext, ToolResult } from '../../claude-tool-interface/SCHEMA.md'

// ===== 输入 Schema =====
export const inputSchema = z.object({
  action: z.enum(['read', 'write', 'delete']).describe('操作类型'),
  path: z.string().optional(),
  content: z.string().optional(),
})

export type Input = z.infer<typeof inputSchema>

// ===== 输出类型 =====
export type Output =
  | { kind: 'read'; content: string }
  | { kind: 'write'; path: string }
  | { kind: 'delete'; path: string }
  | { kind: 'error'; message: string }

// ===== 工具实现 =====
export const myNewTool: OpenClawTool<Input, Output> = {
  name: 'my_new_tool',
  searchHint: 'manage local files',

  inputSchema,

  async call(args, context, canUseTool) {
    // 1. 权限检查
    if (!(await canUseTool('my_new_tool'))) {
      return { data: { kind: 'error', message: 'Permission denied' } }
    }

    // 2. 参数验证
    if (args.action !== 'read' && !args.path) {
      return { data: { kind: 'error', message: 'path required' } }
    }

    // 3. 执行
    switch (args.action) {
      case 'read':
        return { data: { kind: 'read', content: await fs.readFile(args.path!) } }
      case 'write':
        return { data: { kind: 'write', path: args.path! } }
      case 'delete':
        return { data: { kind: 'delete', path: args.path! } }
    }
  },

  description: (input) => {
    switch (input.action) {
      case 'read': return `Read file at ${input.path || '(path required)'}`
      case 'write': return `Write content to ${input.path || '(path required)'}`
      case 'delete': return `Delete file at ${input.path || '(path required)'}`}
  },

  isConcurrencySafe: (input) => input.action === 'read',
  isReadOnly: (input) => input.action === 'read',
  isDestructive: (input) => input.action === 'delete',
  isEnabled: () => true,

  maxResultSizeChars: 10000,
}
```

## 4. 验证

检查清单：
- [ ] `name` 唯一
- [ ] `inputSchema` 所有必填字段有 `.describe()`
- [ ] `call()` 返回 `{ data, error? }`
- [ ] `isConcurrencySafe` 返回布尔值
- [ ] `isReadOnly` 返回布尔值
- [ ] `description()` 根据输入变化
- [ ] `maxResultSizeChars` 设置合理
