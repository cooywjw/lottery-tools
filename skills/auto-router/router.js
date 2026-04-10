// Auto Router - 智能 Agent 路由引擎
// 方案 A: 关键词匹配 + LLM 兜底

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 加载配置
const CONFIG_PATH = path.join(__dirname, 'config.json');
const REGISTRY_PATH = path.join(__dirname, '..', 'agency-sync', 'registry.json');

let config = {};
try {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
} catch (e) {
  config = { concurrency: 1, llmProvider: 'deepseek', llmModel: 'deepseek/deepseek-chat', fallbackEnabled: true };
}

// 关键词路由表 - 60+ 规则
// 规则顺序很重要：更具体/技术性的关键词放在前面，避免被通用词抢先匹配
const KEYWORD_RULES = [
  // Engineering (52) - 技术类关键词优先（更具体）
  { keywords: ['前端', 'frontend', 'react', 'vue', 'angular', 'typescript'], agent: 'engineering-frontend-developer', desc: '前端开发' },
  { keywords: ['后端', 'backend', 'api', 'server'], agent: 'engineering-backend-developer', desc: '后端开发' },
  { keywords: ['数据库优化', '查询优化', '索引', '慢查询', 'query optimization'], agent: 'engineering-database-admin', desc: 'DBA' },
  { keywords: ['数据库', 'database', 'SQL', 'MySQL', 'PostgreSQL', 'Mongo', 'db'], agent: 'engineering-database-admin', desc: 'DBA' },
  { keywords: ['全栈', 'fullstack', 'full-stack', '前后端'], agent: 'engineering-fullstack-developer', desc: '全栈开发' },
  { keywords: ['移动', 'mobile', 'app', 'iOS', 'Android', 'flutter'], agent: 'engineering-mobile-developer', desc: '移动开发' },
  { keywords: ['DevOps', '部署', 'CI/CD', 'pipeline', 'jenkins'], agent: 'engineering-devops-engineer', desc: 'DevOps' },
  { keywords: ['云', 'cloud', 'AWS', 'Azure', 'GCP', '阿里云'], agent: 'engineering-cloud-architect', desc: '云架构师' },
  { keywords: ['安全', 'security', '渗透', '黑客', '漏洞', '加密'], agent: 'engineering-security-engineer', desc: '安全工程师' },
  { keywords: ['AI', '机器学习', 'ML', '模型', '训练', '深度学习'], agent: 'engineering-ml-engineer', desc: 'ML 工程师' },
  { keywords: ['数据工程', 'data engineer', 'ETL', '数据管道'], agent: 'engineering-data-engineer', desc: '数据工程师' },
  { keywords: ['区块链', 'blockchain', 'web3', '智能合约', 'solidity'], agent: 'engineering-blockchain-developer', desc: '区块链开发' },
  { keywords: ['嵌入式', 'embedded', '物联网', 'IoT', '硬件'], agent: 'engineering-embedded-developer', desc: '嵌入式开发' },
  { keywords: ['游戏', 'game', 'unity', 'unreal', '游戏开发'], agent: 'engineering-game-developer', desc: '游戏开发' },
  { keywords: ['算法', 'algorithm', 'leetcode', '数据结构'], agent: 'engineering-algorithm-engineer', desc: '算法工程师' },
  { keywords: ['架构', 'architect', '系统设计', '技术选型', '微服务'], agent: 'engineering-systems-architect', desc: '系统架构师' },
  { keywords: ['网络', 'network', 'TCP/IP', 'HTTP', 'CDN', 'DNS'], agent: 'engineering-network-engineer', desc: '网络工程师' },
  { keywords: ['性能优化', 'performance tuning', '压测', '负载', '高并发'], agent: 'testing-performance-engineer', desc: '性能测试' },
  { keywords: ['代码审查', 'code review', 'CR', '重构', 'clean code'], agent: 'engineering-code-reviewer', desc: '代码审查员' },
  { keywords: ['技术写作', 'tech writer', 'API 文档'], agent: 'engineering-technical-writer', desc: '技术写作' },

  // Testing (13)
  { keywords: ['自动化测试', '单元测试', 'jest', 'pytest'], agent: 'testing-qa-automation-engineer', desc: '自动化测试' },
  { keywords: ['安全测试', '渗透测试', '漏洞扫描'], agent: 'testing-security-tester', desc: '安全测试' },
  { keywords: ['测试工具', 'selenium', 'cypress', 'playwright'], agent: 'testing-test-tools-specialist', desc: '测试工具专家' },
  { keywords: ['手动测试', '功能测试', '验收'], agent: 'testing-manual-qa', desc: '手动测试' },
  { keywords: ['回归测试', '冒烟测试', 'smoke'], agent: 'testing-regression-tester', desc: '回归测试' },
  { keywords: ['可用性', 'usability', 'UX 测试'], agent: 'testing-usability-tester', desc: '可用性测试' },
  { keywords: ['兼容性', '浏览器兼容', '跨平台'], agent: 'testing-compatibility-tester', desc: '兼容性测试' },
  { keywords: ['探索性测试', 'exploratory', 'ad-hoc'], agent: 'testing-exploratory-tester', desc: '探索性测试' },
  { keywords: ['测试', 'QA', '质量保证', 'bug'], agent: 'testing-qa-engineer', desc: 'QA 工程师' },

  // Marketing (15+) - 放在技术类之后
  { keywords: ['增长', 'growth', '获客', '拉新', '裂变', '病毒传播'], agent: 'marketing-growth-hacker', desc: '增长黑客' },
  { keywords: ['内容', 'content', '文案', '写作', '文章', 'blog'], agent: 'marketing-content-strategist', desc: '内容策略师' },
  { keywords: ['SEO', '搜索排名', '搜索引擎', 'organic traffic'], agent: 'marketing-seo-specialist', desc: 'SEO 专家' },
  { keywords: ['社交媒体', 'social media', '微博', '微信', '小红书', '抖音'], agent: 'marketing-social-media-manager', desc: '社媒经理' },
  { keywords: ['品牌', 'brand', '定位', 'VI', '形象'], agent: 'marketing-brand-strategist', desc: '品牌战略师' },
  { keywords: ['邮件', 'email', 'EDM', 'newsletter'], agent: 'marketing-email-marketer', desc: '邮件营销' },
  { keywords: ['PR', '公关', '媒体', '新闻稿', '发布会'], agent: 'marketing-pr-specialist', desc: '公关专家' },
  { keywords: ['社群', '社区', '用户群'], agent: 'marketing-community-manager', desc: '社群经理' },
  { keywords: ['投放', '广告', 'ad', 'Facebook', 'Google', '信息流'], agent: 'marketing-paid-ads-specialist', desc: '投放专家' },
  { keywords: ['活动', 'campaign', '促销', '大促', '节日'], agent: 'marketing-event-coordinator', desc: '活动策划' },
  { keywords: ['KOL', '网红', '达人', ' influencer', '种草'], agent: 'marketing-influencer-specialist', desc: '达人营销' },
  { keywords: ['营销分析', 'marketing analytics', '漏斗', '转化'], agent: 'marketing-analytics-specialist', desc: '营销分析师' },
  { keywords: ['视频营销', '短视频', 'video marketing', '脚本'], agent: 'marketing-video-marketer', desc: '视频营销' },
  { keywords: ['联盟', 'affiliate', '分销', '佣金'], agent: 'marketing-affiliate-manager', desc: '联盟经理' },
  { keywords: ['产品营销', 'product marketing', 'GTM', '上市'], agent: 'marketing-product-marketer', desc: '产品营销' },

  // Testing (13)
  { keywords: ['测试', 'test', 'QA', '质量保证', 'bug'], agent: 'testing-qa-engineer', desc: 'QA 工程师' },
  { keywords: ['安全测试', 'security test', '渗透测试', '漏洞扫描'], agent: 'testing-security-tester', desc: '安全测试' },
  { keywords: ['手动测试', 'manual test', '功能测试', '验收'], agent: 'testing-manual-qa', desc: '手动测试' },
  { keywords: ['回归测试', 'regression', '冒烟测试', 'smoke'], agent: 'testing-regression-tester', desc: '回归测试' },
  { keywords: ['可用性', 'usability', '用户体验', 'UX 测试'], agent: 'testing-usability-tester', desc: '可用性测试' },
  { keywords: ['兼容性', 'compatibility', '浏览器兼容', '跨平台'], agent: 'testing-compatibility-tester', desc: '兼容性测试' },
  { keywords: ['探索性测试', 'exploratory', 'ad-hoc'], agent: 'testing-exploratory-tester', desc: '探索性测试' },
  { keywords: ['测试工具', 'test tool', 'selenium', 'cypress', 'playwright'], agent: 'testing-test-tools-specialist', desc: '测试工具专家' },

  // Product (5)
  { keywords: ['产品', 'product', 'PRD', '需求', 'feature'], agent: 'product-product-manager', desc: '产品经理' },
  { keywords: ['产品负责人', 'PO', 'product owner', 'backlog'], agent: 'product-product-owner', desc: 'Product Owner' },
  { keywords: ['用户研究', 'user research', '访谈', '问卷', ' persona'], agent: 'product-user-researcher', desc: '用户研究员' },
  { keywords: ['数据分析', 'data analysis', 'BI', '报表', 'metrics'], agent: 'product-data-analyst', desc: '数据分析师' },
  { keywords: ['竞品', 'competitor', '市场调研', '行业分析'], agent: 'product-competitive-analyst', desc: '竞品分析师' },

  // Design (8)
  { keywords: ['设计', 'design', 'UI', '界面', '视觉'], agent: 'design-ui-designer', desc: 'UI 设计师' },
  { keywords: ['UX', '用户体验', '交互', 'wireframe', '原型'], agent: 'design-ux-architect', desc: 'UX 架构师' },
  { keywords: ['品牌设计', 'brand design', 'logo', 'VI', '视觉识别'], agent: 'design-brand-guardian', desc: '品牌设计师' },
  { keywords: ['插画', 'illustration', '手绘', 'icon', '图形'], agent: 'design-visual-storyteller', desc: '插画师' },
  { keywords: ['动效', 'motion', 'animation', '动效设计', 'Lottie'], agent: 'design-motion-designer', desc: '动效设计师' },
  { keywords: ['3D', '三维', 'blender', 'C4D', '建模'], agent: 'design-3d-designer', desc: '3D 设计师' },
  { keywords: ['设计系统', 'design system', '组件库', '规范'], agent: 'design-systems-architect', desc: '设计系统架构师' },

  // Project Management (7)
  { keywords: ['项目', 'project', 'PM', '项目经理', '进度'], agent: 'project-management-project-manager', desc: '项目经理' },
  { keywords: ['敏捷', 'agile', 'scrum', 'sprint', '看板'], agent: 'project-management-scrum-master', desc: 'Scrum Master' },
  { keywords: ['项目集', 'program', '大型项目', '组合管理'], agent: 'project-management-program-manager', desc: '项目集经理' },
  { keywords: ['风险', 'risk', '风险管理', '应急预案'], agent: 'project-management-risk-manager', desc: '风险经理' },
  { keywords: ['交付', 'delivery', '上线', '发布', 'deployment'], agent: 'project-management-delivery-lead', desc: '交付负责人' },

  // Academic (5)
  { keywords: ['学术', 'academic', '论文', 'research', '文献'], agent: 'academic-researcher', desc: '学术研究员' },
  { keywords: ['历史', 'history', '史学', '史料', '考古'], agent: 'academic-historian', desc: '历史学家' },
  { keywords: ['心理', 'psychology', '心理分析', '行为'], agent: 'academic-psychologist', desc: '心理学家' },
  { keywords: ['人类学', 'anthropology', '文化', '民族'], agent: 'academic-anthropologist', desc: '人类学家' },
  { keywords: ['地理', 'geography', '地图', 'GIS', '空间'], agent: 'academic-geographer', desc: '地理学家' },

  // Specialized (10+)
  { keywords: ['法律', 'legal', '合同', '法务', '合规', 'compliance'], agent: 'legal-legal-advisor', desc: '法律顾问' },
  { keywords: ['财务', 'finance', '会计', '报表', '预算'], agent: 'finance-financial-analyst', desc: '财务分析师' },
  { keywords: ['HR', '招聘', '人事', '绩效', '培训'], agent: 'hr-talent-acquisition', desc: '招聘专员' },
  { keywords: ['客服', 'support', '售后', '客户成功', 'CS'], agent: 'support-customer-success', desc: '客户成功' },
  { keywords: ['销售', 'sales', 'BD', '商务', '客户开发'], agent: 'sales-sales-representative', desc: '销售代表' },
  { keywords: ['运维', 'SRE', '值班', 'on-call', '监控'], agent: 'operations-sre-engineer', desc: 'SRE' },
  { keywords: ['技术写作', '文档', 'documentation', 'README'], agent: 'documentation-technical-writer', desc: '技术写作' },
  { keywords: ['翻译', 'translate', '本地化', 'localization', 'i18n'], agent: 'localization-translator', desc: '翻译' },
];

// 加载 Agent 注册表
function loadAgentRegistry() {
  try {
    const data = fs.readFileSync(REGISTRY_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('无法加载 Agent 注册表:', e.message);
    return { agents: [] };
  }
}

// 第一层：关键词匹配
function matchByKeywords(input) {
  const lowerInput = input.toLowerCase();
  
  for (const rule of KEYWORD_RULES) {
    for (const keyword of rule.keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        return {
          matched: true,
          agent: rule.agent,
          desc: rule.desc,
          method: 'keyword',
          matchedKeyword: keyword
        };
      }
    }
  }
  
  return { matched: false };
}

// 第二层：LLM 兜底
async function matchByLLM(input, registry) {
  if (!config.fallbackEnabled) {
    return { matched: false, reason: 'LLM fallback disabled' };
  }

  // 构建 Agent 列表供 LLM 选择
  const agentList = registry.agents.slice(0, 50).map(a => ({
    key: a.key,
    description: a.description || 'No description'
  }));

  const prompt = `你是一个智能路由系统。根据用户输入，选择最合适的 Agent 来处理任务。

可用 Agent 列表（前50个）：
${JSON.stringify(agentList, null, 2)}

用户输入："${input}"

请分析用户需求，选择最合适的 Agent。返回 JSON 格式：
{
  "selectedAgent": "agent-key",
  "confidence": 0.85,
  "reason": "选择理由"
}

如果无法确定，返回：
{
  "selectedAgent": null,
  "confidence": 0,
  "reason": "无法匹配"
}`;

  try {
    // 调用 DeepSeek API
    const response = await callDeepSeek(prompt);
    const result = JSON.parse(extractJSON(response));
    
    if (result.selectedAgent && result.confidence >= (config.confidenceThreshold || 0.7)) {
      const agent = registry.agents.find(a => a.key === result.selectedAgent);
      return {
        matched: true,
        agent: result.selectedAgent,
        desc: agent ? agent.description : 'Unknown',
        method: 'llm',
        confidence: result.confidence,
        reason: result.reason
      };
    }
    
    return { matched: false, reason: result.reason || 'Confidence too low' };
  } catch (e) {
    console.error('LLM 路由失败:', e.message);
    return { matched: false, reason: e.message };
  }
}

// 调用 DeepSeek API
async function callDeepSeek(prompt) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 环境变量未设置');
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.llmModel || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`API 错误: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 提取 JSON
function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

// 执行路由
async function route(input, options = {}) {
  const registry = loadAgentRegistry();
  
  console.log(`🔄 路由分析: "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}"`);
  console.log('');

  // 第一层：关键词匹配
  const keywordResult = matchByKeywords(input);
  if (keywordResult.matched) {
    console.log(`✅ 关键词匹配成功`);
    console.log(`   Agent: ${keywordResult.agent}`);
    console.log(`   描述: ${keywordResult.desc}`);
    console.log(`   匹配词: ${keywordResult.matchedKeyword}`);
    
    if (options.exec) {
      return await executeAgent(keywordResult.agent, input);
    }
    return keywordResult;
  }

  console.log('❌ 关键词未匹配，进入 LLM 兜底...');
  console.log('');

  // 第二层：LLM 兜底
  const llmResult = await matchByLLM(input, registry);
  if (llmResult.matched) {
    console.log(`✅ LLM 匹配成功`);
    console.log(`   Agent: ${llmResult.agent}`);
    console.log(`   描述: ${llmResult.desc}`);
    console.log(`   置信度: ${(llmResult.confidence * 100).toFixed(1)}%`);
    console.log(`   理由: ${llmResult.reason}`);
    
    if (options.exec) {
      return await executeAgent(llmResult.agent, input);
    }
    return llmResult;
  }

  // 默认兜底
  console.log('❌ LLM 也无法确定，使用默认 Agent');
  const defaultAgent = config.defaultAgent || 'general-assistant';
  console.log(`   默认 Agent: ${defaultAgent}`);
  
  if (options.exec) {
    return await executeAgent(defaultAgent, input);
  }
  return { matched: true, agent: defaultAgent, method: 'default' };
}

// 执行 Agent
async function executeAgent(agentKey, input) {
  console.log('');
  console.log(`🚀 执行 Agent: ${agentKey}`);
  console.log('─'.repeat(50));
  
  try {
    // 调用 coordinator 执行
    const cmd = `node "${path.join(__dirname, '..', 'coordinator', 'coordinator.js')}" spawn --role "${agentKey}" --task "${input.replace(/"/g, '\\"')}"`;
    const result = execSync(cmd, { encoding: 'utf8', timeout: 120000 });
    console.log(result);
    return { success: true, output: result };
  } catch (e) {
    console.error('执行失败:', e.message);
    return { success: false, error: e.message };
  }
}

// 列出所有规则
function listRules() {
  console.log('📋 关键词路由规则（共 ' + KEYWORD_RULES.length + ' 条）');
  console.log('');
  
  const byCategory = {};
  for (const rule of KEYWORD_RULES) {
    const category = rule.agent.split('-')[0];
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(rule);
  }
  
  for (const [cat, rules] of Object.entries(byCategory)) {
    console.log(`\n[${cat.toUpperCase()}] (${rules.length} 条)`);
    for (const rule of rules) {
      console.log(`  • ${rule.agent}`);
      console.log(`    关键词: ${rule.keywords.join(', ')}`);
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const input = args.slice(1).join(' ');

  switch (command) {
    case 'route':
      if (!input) {
        console.log('用法: node router.js route "<你的任务描述>"');
        process.exit(1);
      }
      await route(input);
      break;
      
    case 'exec':
      if (!input) {
        console.log('用法: node router.js exec "<你的任务描述>"');
        process.exit(1);
      }
      await route(input, { exec: true });
      break;
      
    case 'rules':
      listRules();
      break;
      
    default:
      console.log('Auto Router - 智能 Agent 路由引擎');
      console.log('');
      console.log('用法:');
      console.log('  node router.js route "<任务>"  - 测试路由（不执行）');
      console.log('  node router.js exec "<任务>"   - 路由并执行 Agent');
      console.log('  node router.js rules           - 列出所有路由规则');
      console.log('');
      console.log('配置:');
      console.log(`  并发数: ${config.concurrency}`);
      console.log(`  LLM: ${config.llmProvider}/${config.llmModel}`);
      console.log(`  兜底: ${config.fallbackEnabled ? '启用' : '禁用'}`);
  }
}

main().catch(console.error);
