// WeChat Draft Publisher - Node.js implementation
// Reads HTML from file and publishes to WeChat draft box

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load config
const configPath = 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const APPID = config.appid;
const APPSECRET = config.appsecret;

// Get access token
function getAccessToken() {
    return new Promise((resolve, reject) => {
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = JSON.parse(data);
                if (result.access_token) resolve(result.access_token);
                else reject(new Error(`Token error: ${JSON.stringify(result)}`));
            });
        }).on('error', reject);
    });
}

// Upload thumb image (required for draft)
function uploadThumb(accessToken) {
    return new Promise((resolve, reject) => {
        // Use default cover - empty thumb_media_id first
        resolve({ media_id: '' });
    });
}

// Create draft
function createDraft(accessToken, title, content, author, thumbMediaId) {
    return new Promise((resolve, reject) => {
        const payload = {
            articles: [{
                title: title,
                author: author || '',
                digest: '',
                content: content,
                content_source_url: '',
                thumb_media_id: thumbMediaId || '',
                need_open_comment: 0,
                only_fans_can_comment: 0
            }]
        };

        const data = JSON.stringify(payload);
        const options = {
            hostname: 'api.weixin.qq.com',
            path: `/cgi-bin/draft/add?access_token=${accessToken}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                const result = JSON.parse(responseData);
                if (result.errcode === 0) {
                    resolve(result);
                } else {
                    reject(new Error(`Draft error: ${JSON.stringify(result)}`));
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    const htmlPath = 'C:/Users/Administrator/.openclaw/workspace/tmp_img/article_styled.html';
    const title = '4.15周三竞彩全场次详细回顾+4.16周四赛事前瞻';

    console.log('Reading HTML...');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    console.log(`HTML length: ${htmlContent.length} chars`);

    console.log('Getting access token...');
    const token = await getAccessToken();
    console.log('Token obtained');

    console.log('Creating draft...');
    const result = await createDraft(token, title, htmlContent, config.author || '', '');
    console.log('Draft created!');
    console.log(`Media ID: ${result.media_id}`);
}

main().catch(console.error);
