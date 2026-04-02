/**
 * Team State Manager
 * 维护 Agent 名称到 sessionKey 的映射表
 * 支持内存缓存 + 磁盘持久化
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'team-state.json');
const MAX_AGENTS = 3; // 最大并发 Agent 数
const AGENT_TIMEOUT_MS = 180000; // 3分钟超时

// 内存缓存
let teamState = {
  version: '1.0.0',
  updated: null,
  agents: {}, // { [name]: { sessionKey, taskId, description, teamName, status, createdAt, lastSeen } }
  teams: {},   // { [teamName]: [agentName, ...] }
  history: [] // 历史记录（最多保留 50 条）
};

/**
 * 加载状态（磁盘 → 内存）
 */
function load() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      // 合并，保留内存中的最新数据
      teamState = { ...parsed, agents: { ...parsed.agents }, teams: { ...parsed.teams }, history: parsed.history || [] };
    }
  } catch (e) {
    console.error('[team-state] load error:', e.message);
  }
}

/**
 * 保存状态（内存 → 磁盘）
 */
function save() {
  try {
    teamState.updated = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(teamState, null, 2), 'utf-8');
  } catch (e) {
    console.error('[team-state] save error:', e.message);
  }
}

/**
 * 注册一个 Agent
 * @param {string} name - Agent 名称（唯一标识）
 * @param {string} sessionKey - OpenClaw session key
 * @param {string} taskId - OpenClaw internal task id
 * @param {string} description - 简短描述
 * @param {string} teamName - 团队名称
 * @returns {{ success: boolean, error?: string, activeCount?: number }}
 */
function register(name, sessionKey, taskId, description, teamName = 'default') {
  load();
  
  const activeAgents = Object.values(teamState.agents).filter(a => a.status === 'running');
  
  if (activeAgents.length >= MAX_AGENTS) {
    return {
      success: false,
      error: `已达到最大并发数 (${MAX_AGENTS})，请等待现有 Agent 完成`,
      activeCount: activeAgents.length
    };
  }
  
  if (teamState.agents[name]) {
    // 已存在，更新
    teamState.agents[name].sessionKey = sessionKey;
    teamState.agents[name].taskId = taskId;
    teamState.agents[name].description = description;
    teamState.agents[name].status = 'running';
    teamState.agents[name].lastSeen = new Date().toISOString();
  } else {
    // 新建
    teamState.agents[name] = {
      sessionKey,
      taskId,
      description,
      teamName,
      status: 'running',
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
  }
  
  // 加入团队
  if (!teamState.teams[teamName]) {
    teamState.teams[teamName] = [];
  }
  if (!teamState.teams[teamName].includes(name)) {
    teamState.teams[teamName].push(name);
  }
  
  // 清理超时 Agent（超过 AGENT_TIMEOUT_MS 未更新的视为超时）
  cleanupTimeouts();
  
  save();
  return { success: true, activeCount: Object.values(teamState.agents).filter(a => a.status === 'running').length };
}

/**
 * 更新 Agent 状态
 * @param {string} name - Agent 名称
 * @param {string} status - 'running' | 'completed' | 'failed' | 'stopped'
 */
function updateStatus(name, status) {
  load();
  if (teamState.agents[name]) {
    teamState.agents[name].status = status;
    teamState.agents[name].lastSeen = new Date().toISOString();
    save();
  }
}

/**
 * 通过名称查找 Agent
 */
function get(name) {
  load();
  cleanupTimeouts();
  return teamState.agents[name] || null;
}

/**
 * 通过 sessionKey 查找 Agent
 */
function getBySessionKey(sessionKey) {
  load();
  cleanupTimeouts();
  return Object.values(teamState.agents).find(a => a.sessionKey === sessionKey) || null;
}

/**
 * 列出所有 Agent
 */
function list(teamName = null) {
  load();
  cleanupTimeouts();
  const agents = Object.entries(teamState.agents).map(([name, data]) => ({ name, ...data }));
  if (teamName) {
    return agents.filter(a => a.teamName === teamName);
  }
  return agents;
}

/**
 * 列出所有活跃 Agent
 */
function listActive(teamName = null) {
  return list(teamName).filter(a => a.status === 'running');
}

/**
 * 移除 Agent
 */
function remove(name) {
  load();
  const agent = teamState.agents[name];
  if (!agent) return false;
  
  // 从团队移除
  if (teamState.teams[agent.teamName]) {
    teamState.teams[agent.teamName] = teamState.teams[agent.teamName].filter(n => n !== name);
  }
  
  // 加入历史
  teamState.history.push({ name, ...agent, removedAt: new Date().toISOString() });
  if (teamState.history.length > 50) {
    teamState.history = teamState.history.slice(-50);
  }
  
  delete teamState.agents[name];
  save();
  return true;
}

/**
 * 获取团队状态摘要
 */
function getTeamStatus() {
  load();
  const all = list();
  const active = all.filter(a => a.status === 'running');
  const completed = all.filter(a => a.status === 'completed');
  const failed = all.filter(a => a.status === 'failed' || a.status === 'stopped');
  
  return {
    total: all.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    maxAllowed: MAX_AGENTS,
    agents: all,
    teams: teamState.teams
  };
}

/**
 * 清理超时的 Agent
 */
function cleanupTimeouts() {
  const now = Date.now();
  for (const [name, agent] of Object.entries(teamState.agents)) {
    if (agent.status === 'running') {
      const lastSeen = new Date(agent.lastSeen).getTime();
      if (now - lastSeen > AGENT_TIMEOUT_MS) {
        agent.status = 'timeout';
        agent.removedAt = new Date().toISOString();
      }
    }
  }
}

/**
 * 团队统计
 */
function getStats() {
  load();
  const all = list();
  return {
    activeCount: all.filter(a => a.status === 'running').length,
    maxAgents: MAX_AGENTS,
    timeoutMs: AGENT_TIMEOUT_MS,
    canSpawn: all.filter(a => a.status === 'running').length < MAX_AGENTS
  };
}

module.exports = {
  register,
  updateStatus,
  get,
  getBySessionKey,
  list,
  listActive,
  remove,
  getTeamStatus,
  getStats,
  MAX_AGENTS,
  AGENT_TIMEOUT_MS
};
