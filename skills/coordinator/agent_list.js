/**
 * agent_list - 列出当前活跃的 Agent
 * 
 * 用法:
 *   node agent_list.js [--team <团队名称>]
 */

const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  let teamName = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--team') teamName = args[++i];
  }
  
  const teamState = require('./team-state');
  const agents = teamName ? teamState.list(teamName) : teamState.list();
  const stats = teamState.getStats();
  
  // 格式化输出
  const formattedAgents = agents.map(a => ({
    name: a.name,
    description: a.description,
    team: a.teamName,
    status: a.status,
    createdAt: a.createdAt,
    lastSeen: a.lastSeen,
    age: `${Math.round((Date.now() - new Date(a.createdAt).getTime()) / 1000)}s`
  }));
  
  const output = {
    success: true,
    teamStatus: {
      active: stats.activeCount,
      max: stats.maxAgents,
      available: stats.maxAgents - stats.activeCount
    },
    agents: formattedAgents,
    byTeam: teamState.getTeamStatus().teams
  };
  
  console.log(JSON.stringify(output, null, 2));
}

main();
