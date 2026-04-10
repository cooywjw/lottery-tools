#!/usr/bin/env node
/**
 * auto-router - 智能路由核心脚本
 * 
 * 用法：
 *   node router.js route "<用户消息>"
 *   node router.js list   // 列出所有路由规则
 *   node router.js test "<关键词>"
 */

const fs = require('fs');
const path = require('path');

// ========== 关键词映射表 ==========
const KEYWORD_MAP = [
  // 增长 & 营销
  { keywords: ['增长', '裂变', '获客', '用户增长', '拉新'], agent: 'marketing/marketing-growth-hacker' },
  { keywords: ['内容', '文章', '写作', '创作', '文案', '写文章', '创作内容'], agent: 'marketing/marketing-content-creator' },
  { keywords: ['抖音', '视频号', '短视频'], agent: 'marketing/marketing-douyin-strategist' },
  { keywords: ['小红书', '种草', '小红书笔记'], agent: 'marketing/marketing-xiaohongshu-specialist' },
  { keywords: ['公众号', '微信公众号', '微信'], agent: 'marketing/marketing-wechat-official-account' },
  { keywords: ['微博'], agent: 'marketing/marketing-weibo-strategist' },
  { keywords: ['知乎'], agent: 'marketing/marketing-zhihu-strategist' },
  { keywords: ['SEO', '搜索引擎优化'], agent: 'marketing/marketing-seo-specialist' },
  { keywords: ['私域', '社群', '微信群'], agent: 'marketing/marketing-private-domain-operator' },
  { keywords: ['直播', '带货', '电商直播'], agent: 'marketing/marketing-livestream-commerce-coach' },
  { keywords: ['B站', 'bilibili', 'B站内容'], agent: 'marketing/marketing-bilibili-content-strategist' },
  { keywords: ['Instagram', 'ins图片'], agent: 'marketing/marketing-instagram-curator' },
  { keywords: ['TikTok', '海外抖音'], agent: 'marketing/marketing-tiktok-strategist' },
  { keywords: ['LinkedIn', '领英'], agent: 'marketing/marketing-linkedin-creator' },
  { keywords: ['营销策略', '推广', '广告'], agent: 'marketing/marketing-social-media-strategist' },
  { keywords: ['ASO', '应用商店'], agent: 'marketing/marketing-app-store-optimizer' },
  { keywords: ['轮播图', 'carousel'], agent: 'marketing/marketing-carousel-growth-engine' },
  { keywords: ['书籍', '出版', '写书'], agent: 'marketing/marketing-book-co-author' },
  { keywords: ['播客', 'podcast'], agent: 'marketing/marketing-podcast-strategist' },
  { keywords: ['跨境', '跨境电商', '外贸'], agent: 'marketing/marketing-cross-border-ecommerce' },

  // 工程开发
  { keywords: ['前端', 'React', 'Vue', 'Angular', 'HTML', 'CSS', '网页'], agent: 'engineering/engineering-frontend-developer' },
  { keywords: ['后端', 'API', '数据库', 'Server', 'Node'], agent: 'engineering/engineering-backend-architect' },
  { keywords: ['移动端', 'iOS', 'Android', 'React Native', 'Flutter', 'APP'], agent: 'engineering/engineering-mobile-app-builder' },
  { keywords: ['AI', '机器学习', 'ML', '深度学习', '模型训练'], agent: 'engineering/engineering-ai-engineer' },
  { keywords: ['DevOps', 'CI/CD', 'Docker', 'K8s', '部署', '自动化部署'], agent: 'engineering/engineering-devops-automator' },
  { keywords: ['安全', '漏洞', '渗透', '审计', 'security'], agent: 'engineering/engineering-security-engineer' },
  { keywords: ['代码审查', 'code review', '代码质量'], agent: 'engineering/engineering-code-reviewer' },
  { keywords: ['数据库优化', 'SQL优化', '索引'], agent: 'engineering/engineering-database-optimizer' },
  { keywords: ['SRE', '可靠性', '监控', '报警'], agent: 'engineering/engineering-sre' },
  { keywords: ['飞书', 'feishu'], agent: 'engineering/engineering-feishu-integration-developer' },
  { keywords: ['微信小程序'], agent: 'engineering/engineering-wechat-mini-program-developer' },
  { keywords: ['CMS', '内容管理'], agent: 'engineering/engineering-cms-developer' },
  { keywords: ['固件', '嵌入式', ' firmware'], agent: 'engineering/engineering-embedded-firmware-engineer' },
  { keywords: ['Git', '工作流', '分支'], agent: 'engineering/engineering-git-workflow-master' },
  { keywords: ['智能合约', 'Solidity', '区块链'], agent: 'engineering/engineering-solidity-smart-contract-engineer' },
  { keywords: ['技术文档', 'API文档', '写文档'], agent: 'engineering/engineering-technical-writer' },

  // 测试
  { keywords: ['测试', 'QA', '质量'], agent: 'testing/testing-reality-checker' },
  { keywords: ['性能', '压测', 'benchmark'], agent: 'testing/testing-performance-benchmarker' },
  { keywords: ['API测试', '接口测试'], agent: 'testing/testing-api-tester' },
  { keywords: ['无障碍', 'a11y', 'WCAG'], agent: 'testing/testing-accessibility-auditor' },
  { keywords: ['自动化测试', 'test automation'], agent: 'testing/testing-workflow-optimizer' },

  // 设计
  { keywords: ['UI', '界面设计', '视觉'], agent: 'design/design-ui-designer' },
  { keywords: ['UX', '用户体验', '可用性'], agent: 'design/design-ux-researcher' },
  { keywords: ['品牌', '品牌设计'], agent: 'design/design-brand-guardian' },
  { keywords: ['图片生成', 'AI画图', 'midjourney'], agent: 'design/design-image-prompt-engineer' },

  // 产品
  { keywords: ['产品经理', 'PM', '需求'], agent: 'product/product-manager' },
  { keywords: ['敏捷', 'sprint', '冲刺'], agent: 'product/product-sprint-prioritizer' },
  { keywords: ['趋势', '竞品分析'], agent: 'product/product-trend-researcher' },

  // 项目管理
  { keywords: ['项目管理', '项目经理'], agent: 'project/project-manager-senior' },
  { keywords: ['Jira', '任务管理'], agent: 'project/project-management-jira-workflow-steward' },
  { keywords: ['A/B测试', '实验'], agent: 'project/project-management-experiment-tracker' },

  // 数据
  { keywords: ['数据分析', '报表', '数据整理', '竞彩数据', '彩票数据'], agent: 'data/data-consolidation-agent' },
  { keywords: ['ETL', '数据管道'], agent: 'engineering/engineering-data-engineer' },

  // 销售
  { keywords: ['销售', '售前', 'sales'], agent: 'sales/sales-engineer' },
  { keywords: ['销售漏斗', 'pipeline'], agent: 'sales/sales-pipeline-analyst' },

  // 运营支持
  { keywords: ['供应链', 'SCM', 'chain'], agent: 'supply/supply-chain-strategist' },
  { keywords: ['运营', '日常运营'], agent: 'support/support-analytics-reporter' },
  { keywords: ['财务', '预算'], agent: 'support/support-finance-tracker' },
  { keywords: ['合规', '法务'], agent: 'support/support-legal-compliance-checker' },
  { keywords: ['客服', '客户响应'], agent: 'support/support-support-responder' },
  { keywords: ['Executive', '高管', '总裁'], agent: 'support/support-executive-summary-generator' },
];

// ========== 工具函数 ==========

function normalizeText(text) {
  return text.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, ' ');
}

function findKeywordMatch(userMessage) {
  const normalized = normalizeText(userMessage);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const entry of KEYWORD_MAP) {
    for (const kw of entry.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        // 匹配长度越长得分越高
        const score = kw.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry.agent;
        }
      }
    }
  }
  
  return bestMatch;
}

/**
 * 从注册表获取所有可用 Agent（用于 LLM 路由）
 */
function getAllAgents() {
  const registryPath = path.join(__dirname, '../agency-sync/registry.json');
  if (!fs.existsSync(registryPath)) {
    return [];
  }
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  return Object.keys(registry);
}

/**
 * 构建 LLM 路由 Prompt
 */
function buildLLMPrompt(userMessage, agents) {
  const agentList = agents.slice(0, 100).join('\n'); // 限制数量避免 token 爆炸
  return `任务：${userMessage}

可用 Agent（部分）：
${agentList}

请从可用 Agent 中选择最合适的一个。
只需要回复 Agent 的 key，例如：marketing/marketing-growth-hacker
不要解释，不要多余文字，只回复 Agent key。`;
}

// ========== CLI 命令 ==========

function listRules() {
  console.log('\n=== 关键词路由规则（共 ' + KEYWORD_MAP.length + ' 条）===\n');
  for (const entry of KEYWORD_MAP) {
    console.log('关键词: ' + entry.keywords.join(', '));
    console.log('  → ' + entry.agent);
    console.log('');
  }
}

function testKeyword(keyword) {
  const result = findKeywordMatch(keyword);
  console.log('关键词: ' + keyword);
  console.log('匹配结果: ' + (result || '未匹配'));
}

async function route(userMessage) {
  // 1. 先尝试关键词匹配
  const keywordMatch = findKeywordMatch(userMessage);
  if (keywordMatch) {
    console.log(JSON.stringify({
      matched: true,
      method: 'keyword',
      agent: keywordMatch,
      reason: '关键词匹配'
    }));
    return;
  }

  // 2. LLM 兜底（仅在有注册表时）
  const agents = getAllAgents();
  if (agents.length === 0) {
    console.log(JSON.stringify({
      matched: false,
      method: 'none',
      agent: null,
      reason: '无可用 Agent'
    }));
    return;
  }

  try {
    const prompt = buildLLMPrompt(userMessage, agents);
    
    // 使用 DeepSeek 进行路由判断
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.DEEPSEEK_API_KEY || ''
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      throw new Error('LLM API failed: ' + response.status);
    }

    const data = await response.json();
    const agent = data.choices[0].message.content.trim();

    console.log(JSON.stringify({
      matched: true,
      method: 'llm',
      agent: agent,
      reason: 'LLM 智能路由'
    }));
  } catch (e) {
    console.log(JSON.stringify({
      matched: false,
      method: 'error',
      agent: null,
      reason: 'LLM 路由失败: ' + e.message
    }));
  }
}

// ========== 主入口 ==========

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'list') {
    listRules();
  } else if (command === 'test') {
    testKeyword(args.slice(1).join(' '));
  } else if (command === 'route') {
    await route(args.slice(1).join(' '));
  } else {
    console.log('Usage:');
    console.log('  node router.js route "<用户消息>"  // 路由');
    console.log('  node router.js list                // 列出规则');
    console.log('  node router.js test "<关键词>"      // 测试匹配');
  }
}

main();
