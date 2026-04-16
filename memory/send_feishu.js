const https = require('https');

async function main() {
  // Get token
  const tokenBody = JSON.stringify({
    app_id: "cli_a938c99e30791cef",
    app_secret: "CSG8xDGnEXnITGZ26hnUQg2jiR81zoSe"
  });
  
  const tokenReq = https.request({
    hostname: 'open.feishu.cn',
    path: '/open-apis/auth/v3/tenant_access_token/internal',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': tokenBody.length }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const tokenResp = JSON.parse(data);
      const token = tokenResp.tenant_access_token;
      console.log('Token:', token);
      sendMessage(token);
    });
  });
  tokenReq.write(tokenBody);
  tokenReq.end();

  function sendMessage(token) {
    const msg = {
      receive_id: "ou_1b35a7e08c18ad9df24f0491eb2f06e6",
      receive_id_type: "open_id",
      msg_type: "text",
      content: JSON.stringify({
        text: `【📊 每日爆款视频】今日各平台热门参考

😄 阿伟，今天的热门视频给你整理好了，看看有没有灵感！

━━━━━━ B站热门 ━━━━━━
1. 【苏新皓｜4K直拍】Talk WORTHY? Talk DIRTY! 直拍｜浪漫主义·演唱会
2. 《崩坏：星穹铁道》即兴巡演PV：「新手指南」
3. 短片《榜样》·致敬雷锋
4. 一个人如果一辈子都在玩游戏，会留下什么？
5. 凭实力单身
6. 【网站】当观测既是存在，你能忍住不看吗
7. 最后的30分钟，你愿怎样度过？
8. 印度指定有点说法
9. 终于看到正常的菲比二创了
10. 盘点嘎子直播带货名场面！

━━━━━━ 抖音热门 ━━━━━━
今日以音乐类内容为主，老歌翻红较热～

━━━━━━ 快手热门 ━━━━━━
今日以平台榜单类内容为主～

━━━━━━
选好后告诉我，我帮你生成拍摄脚本和素材方案！ 🎬`
      })
    };
    
    const msgStr = JSON.stringify(msg);
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/im/v1/messages?receive_id_type=open_id',
      method: 'POST',
      headers: { 
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(msgStr)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Response:', data);
      });
    });
    req.write(msgStr);
    req.end();
  }
}

main().catch(console.error);
