const https = require('https');

const APP_ID = 'cli_a938c99e30791cef';
const APP_SECRET = 'CSG8xDGnEXnITGZ26hnUQg2jiR81zoSe';
const USER_OPEN_ID = 'ou_1b35a7e08c18ad9df24f0491eb2f06e6';

const messageContent = `**【📊 每日爆款视频】今日各平台热门参考**
*2026年4月11日*

---

**🔴 B站热门视频**

1. 我嫁给你是来享福的，不是来吃苦的！别再被这句话洗脑了！
2. 《百米自由搏击》
3. 【檀健次】【B站独家】「多见一次」个人巡回演唱会大电影
4. 《原神》角色预告-「莉奈娅：精准答疑，倾心追奇！」
5. 当你穿进老钱班21
6. "至此，已成仙品！！！"
7. 北约对美国的反抗
8. 用船制作的跑酷？
9. 《渣养翻车》1-3合集
10. 住手☆！不要用1月新番玷污我啊啊啊！！【泛式】

---

**🟠 抖音热门趋势**

1. 抖音视频热门爆款推荐2026
2. 2026年最新网红爆款
3. 2026抖音最火流行歌曲
4. 夢然/可可托海的牧羊人等经典老歌翻红
5. 2026年四月热门歌曲

---

**🟡 快手热门趋势**

1. 快手2026年排行榜
2. 快手短视频主播排行榜2026前十名
3. 2026年热门短视频平台汇总

---

选好后告诉我，我帮你生成拍摄脚本和素材方案 🎬`;

async function getTenantAccessToken() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET });
    const options = {
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body);
        if (result.code === 0) resolve(result.tenant_access_token);
        else reject(new Error(`Failed to get token: ${result.msg}`));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendMessage(token) {
  // Build card content
  const card = {
    config: { wide_screen_mode: true },
    elements: [
      {
        tag: 'markdown',
        content: messageContent
      }
    ]
  };

  const payload = {
    receive_id: USER_OPEN_ID,
    receive_id_type: 'open_id',
    msg_type: 'interactive',
    content: JSON.stringify(card)
  };

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'open.feishu.cn',
      path: '/open-apis/im/v1/messages?receive_id_type=open_id',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`
      }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body);
        if (result.code === 0) {
          console.log('✅ 消息发送成功！');
          resolve(result);
        } else {
          console.error('❌ 发送失败:', result.msg);
          reject(new Error(`Send failed: ${result.msg}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    console.log('正在获取 Access Token...');
    const token = await getTenantAccessToken();
    console.log('正在发送消息...');
    await sendMessage(token);
  } catch (err) {
    console.error('错误:', err.message);
    process.exit(1);
  }
})();
