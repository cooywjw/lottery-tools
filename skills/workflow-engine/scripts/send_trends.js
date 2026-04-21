const https = require('https');

const APP_ID = 'cli_a938c99e30791cef';
const APP_SECRET = 'CSG8xDGnEXnITGZ26hnUQg2jiR81zoSe';

const text = '【📊 每日爆款视频】今日各平台热门参考\n\n---\n\n【B站】\n1. 口技表演《三打白骨精》\n2. 《崩坏：星穹铁道》银狼LV.999角色PV——「我独自满级」\n3. "每次生日许的愿 其实都与你有关"2.0\n4.［meme］豌豆公主\n5. 《非法组队》\n6. 《异环》公测PV｜Play on！\n7. 当你穿进老钱班22\n8. 疑似三打白骨精现场真实画面流出\n9. 刘巳道重拍《哭声》：怀疑即有罪，神明皆恶鬼\n10. 见面5秒开始战斗\n\n【抖音】\n（暂无精准数据，待补充）\n\n【快手】\n（暂无精准数据，待补充）\n\n---\n选好后告诉我，我帮你生成拍摄脚本和素材方案 🎬';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'open.feishu.cn',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  // Get tenant access token
  const tokenResp = await post('/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: APP_ID,
    app_secret: APP_SECRET
  });
  console.log('Token response:', JSON.stringify(tokenResp));
  
  if (!tokenResp.tenant_access_token) {
    console.error('Failed to get token');
    return;
  }
  
  const token = tokenResp.tenant_access_token;
  
  // Send message
  const msgBody = JSON.stringify({
    receive_id: 'ou_1b35a7e08c18ad9df24f0491eb2f06e6',
    receive_id_type: 'open_id',
    msg_type: 'text',
    content: JSON.stringify({ text })
  });
  
  const sendReq = https.request({
    hostname: 'open.feishu.cn',
    path: '/open-apis/im/v1/messages?receive_id_type=open_id',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(msgBody)
    }
  }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log('Send result:', d));
  });
  sendReq.on('error', console.error);
  sendReq.write(msgBody);
  sendReq.end();
}

main().catch(console.error);