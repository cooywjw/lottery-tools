/**
 * agent_status - 获取团队整体状态
 * 
 * 用法:
 *   node agent_status.js
 */

const teamState = require('./team-state');

async function main() {
  const status = teamState.getTeamStatus();
  const stats = teamState.getStats();
  
  console.log(JSON.stringify({
    success: true,
    teamStatus: {
      active: stats.activeCount,
      max: stats.maxAgents,
      available: stats.maxAgents - stats.activeCount,
      canSpawn: stats.canSpawn
    },
    summary: {
      total: status.total,
      active: status.active.length,
      completed: status.completed.length,
      failed: status.failed.length
    },
    agents: status.agents.map(a => ({
      name: a.name,
      description: a.description,
      status: a.status,
      team: a.teamName,
      createdAt: a.createdAt
    })),
    teams: Object.entries(status.teams).map(([name, agents]) => ({
      team: name,
      agentCount: agents.length,
      agents
    }))
  }, null, 2));
}

main();
