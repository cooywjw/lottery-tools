# TypeScript 接口定义

> 本文件定义 `OpenClawTool` 接口的完整 TypeScript 类型，可直接在 skill 中使用。

## 安装依赖

```bash
npm install zod
# 或在 Node.js 环境中
```

## 核心类型

```typescript
import type { z } from 'zod'

// ============================================================
// 1. 上下文类型
// ============================================================

export interface ToolContext {
  /** 中断控制器 */
  abortController?: AbortController
  /** 当前工作目录 */
  workingDirectory?: string
  /** 会话ID */
  sessionId?: string
  /** 用户ID */
  userId?: string
  /** 权限检查函数 */
  canUseTool: (toolName: string) => Promise<boolean>
  /** 获取当前状态 */
  getState?: () => Record<string, unknown>
  /** 设置进度回调 */
  onProgress?: (progress: ToolProgress) => void
}

// ============================================================
// 2. 进度类型
// ============================================================

export type ToolProgress =
  | { type: 'progress'; message: string; percent?: number }
  | { type: 'log'; message: string }
  | { type: 'error'; message: string }

export type ProgressCallback = (progress: ToolProgress) => void

// ============================================================
// 3. 结果类型
// ============================================================

export interface ToolResult<T> {
  /** 结果数据 */
  data: T
  /** 错误信息（若有） */
  error?: string
  /** 可选：新增消息 */
  newMessages?: ToolMessage[]
}

export type ToolMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// ============================================================
// 4. 工具接口（核心）
// ============================================================

export interface OpenClawTool<
  Input extends Record<string, unknown> = Record<string, unknown>,
  Output = unknown,
> {
  // ----- 身份 -----
  /** 工具唯一名称 */
  readonly name: string
  /** 别名（向后兼容） */
  readonly aliases?: string[]
  /** 3-10词能力描述（用于ToolSearch） */
  readonly searchHint?: string

  // ----- Schema -----
  /** Zod 输入验证 schema */
  readonly inputSchema: z.ZodType<Input>
  /** Zod 输出验证 schema（可选） */
  readonly outputSchema?: z.ZodType<Output>

  // ----- 执行 -----
  /**
   * 核心执行函数
   * @param args 解析后的输入（已通过 inputSchema 验证）
   * @param context 执行上下文
   * @param canUseTool 权限检查
   * @param onProgress 进度回调
   */
  readonly call: (
    args: Input,
    context: ToolContext,
    canUseTool: (toolName: string) => Promise<boolean>,
    onProgress?: ProgressCallback
  ) => Promise<ToolResult<Output>>

  // ----- 动态描述 -----
  /**
   * 根据输入返回不同描述
   * 好的描述：告知模型工具的具体能力，而非泛泛之名
   */
  readonly description: (
    input: Input,
    options: { isNonInteractive: boolean }
  ) => Promise<string>

  // ----- 能力判断 -----
  /**
   * 是否可并发执行
   * - true: 读操作，可多个同时执行
   * - false: 写操作，必须串行
   */
  readonly isConcurrencySafe: (input: Input) => boolean

  /**
   * 是否只读操作
   * - true: 不修改文件/状态
   * - false: 会修改
   */
  readonly isReadOnly: (input: Input) => boolean

  /**
   * 是否破坏性操作（可选）
   * - true: 删除、覆盖等不可逆操作
   */
  readonly isDestructive?: (input: Input) => boolean

  /**
   * 功能是否启用
   * - false: 工具不可用（类似 Claude Code 的 feature flag）
   */
  readonly isEnabled: () => boolean

  // ----- UI渲染（可选）-----
  /**
   * 自定义结果渲染
   * 返回 string: 纯文本
   * 返回 ReactNode: 富文本（需 OpenClaw 支持）
   */
  readonly renderResult?: (output: Output) => string | React.ReactNode

  // ----- 元数据 -----
  /** 结果最大字符数，超限存文件。Infinity = 不限 */
  readonly maxResultSizeChars?: number
}

// ============================================================
// 5. 能力标记类型（辅助）
// ============================================================

export type ToolCapability =
  | 'read'      // 读取数据
  | 'write'     // 写入数据
  | 'delete'    // 删除数据
  | 'execute'   // 执行命令
  | 'network'   // 网络请求
  | 'notify'    // 发送通知

export interface ToolMetadata {
  /** 工具名称 */
  name: string
  /** 版本 */
  version?: string
  /** 能力列表 */
  capabilities: ToolCapability[]
  /** 分类 */
  category?: 'file' | 'network' | 'memory' | 'social' | 'system'
  /** 信任等级 */
  trustLevel: 'safe' | 'review' | 'dangerous'
}

// ============================================================
// 6. Schema 构建辅助
// ============================================================

import { z } from 'zod'

/**
 * 常用 schema 构建块
 */
export const schemas = {
  /** 必填字符串 */
  str: () => z.string(),
  /** 可选字符串 */
  optStr: () => z.string().optional(),
  /** 必填数字 */
  num: () => z.number(),
  /** 可选数字 */
  optNum: () => z.number().optional(),
  /** 布尔值 */
  bool: () => z.boolean(),
  /** 必填整数 */
  int: () => z.number().int(),
  /** 枚举值 */
  enum: <T extends string[]>(values: T) =>
    z.enum(values as [T[number], ...T[number][]]),
  /** 对象 */
  obj: <T extends Record<string, z.ZodType>>(shape: T) => z.object(shape),
  /** 数组 */
  arr: <T extends z.ZodType>(item: T) => z.array(item),
  /** 带描述的字段 */
  field: <T extends z.ZodType>(schema: T, describe: string) =>
    schema.describe(describe),
} as const

// ============================================================
// 7. 工具注册表类型
// ============================================================

export interface ToolRegistry {
  /** 注册工具 */
  register<T extends OpenClawTool>(
    tool: T
  ): void
  /** 按名称查找 */
  get(name: string): OpenClawTool | undefined
  /** 按别名查找 */
  getByAlias(alias: string): OpenClawTool | undefined
  /** 列出所有工具 */
  list(): OpenClawTool[]
  /** 按能力筛选 */
  filterByCapability(cap: ToolCapability): OpenClawTool[]
  /** 按分类筛选 */
  filterByCategory(cat: string): OpenClawTool[]
  /** 检查是否存在 */
  has(name: string): boolean
}
```

---

## 使用示例

```typescript
import { z } from 'zod'
import type { OpenClawTool, ToolContext, ToolResult } from './SCHEMA.js'

// 定义输入 schema
const inputSchema = z.object({
  query: z.string().describe('搜索关键词'),
  limit: z.number().int().min(1).max(100).optional().default(10),
})

type Input = z.infer<typeof inputSchema>
type Output = { results: Array<{ title: string; url: string }> }

// 实现工具
const webSearchTool: OpenClawTool<Input, Output> = {
  name: 'web_search',
  searchHint: 'search the web',

  inputSchema,

  call: async (args, context, canUseTool) => {
    // 权限检查
    if (!(await canUseTool('web_search'))) {
      return { data: null as any, error: 'Permission denied' }
    }

    // 执行搜索
    const results = await performSearch(args.query, args.limit)
    return { data: { results } }
  },

  description: (input) =>
    `Search the web for "${input.query}", return up to ${input.limit} results`,

  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  isEnabled: () => true,

  maxResultSizeChars: 5000,
}
```
