const https = require('https');
const fs = require('fs');

const CONFIG_PATH = 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/config.json';
const HTML_PATH = 'C:/Users/Administrator/.openclaw/workspace/tmp_img/article_styled.html';
const COVER_PATH = 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/assets/default_cover.png';

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
const htmlContent = fs.readFileSync(HTML_PATH, 'utf-8');
const title = '4.15周三竞彩全场次详细回顾+4.16周四赛事前瞻';

console.log(`AppID: ${config.appid}`);
console.log(`HTML length: ${htmlContent.length} chars`);

function getAccessToken() {
    return new Promise((resolve, reject) => {
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appid}&secret=${config.appsecret}`;
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

function addPermanentMaterial(token) {
    return new Promise((resolve, reject) => {
        const boundary = '----WeChatBoundary' + Date.now();
        const fileData = fs.readFileSync(COVER_PATH);
        
        // Build multipart body manually
        const header = Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="media"; filename="cover.png"\r\n` +
            `Content-Type: image/png\r\n\r\n`
        );
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
        
        const desc = Buffer.from(JSON.stringify({
            title: "封面图片",
            introduction: "竞彩文章封面"
        }));
        const descHeader = Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="description"\r\n` +
            `Content-Type: application/json\r\n\r\n`
        );

        const body = Buffer.concat([
            header, fileData, footer,
            descHeader, desc, Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

        const options = {
            hostname: 'api.weixin.qq.com',
            path: `/cgi-bin/material/add_material?access_token=${token}&type=thumb`,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': body.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Material upload response:', data.substring(0, 200));
                const result = JSON.parse(data);
                if (result.media_id) {
                    resolve(result.media_id);
                } else {
                    // 可能返回 url 但没有 media_id（thumb 类型）
                    if (result.url) {
                        console.log('Material URL:', result.url);
                        // thumb 类型返回的是 url，不是 media_id
                        resolve(result.url);
                    } else {
                        reject(new Error(`Upload error: ${data}`));
                    }
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function createDraft(token, title, content, author, thumbMediaId) {
    return new Promise((resolve, reject) => {
        const payload = {
            articles: [{
                title: title,
                author: author || '',
                digest: '',
                content: content,
                content_source_url: '',
                thumb_media_id: thumbMediaId,
                need_open_comment: 0,
                only_fans_can_comment: 0
            }]
        };

        const data = JSON.stringify(payload);
        const options = {
            hostname: 'api.weixin.qq.com',
            path: `/cgi-bin/draft/add?access_token=${token}`,
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
                console.log('Draft response status. Full response:', responseData);
                const result = JSON.parse(responseData);
                // Success: has media_id and no errcode, OR errcode === 0
                if (result.errcode === 0 || (result.media_id && !result.errcode)) {
                    resolve(result);
                } else {
                    reject(new Error(`Draft error: errcode=${result.errcode}, errmsg=${result.errmsg || 'unknown'}`));
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    try {
        console.log('Getting access token...');
        const token = await getAccessToken();

        console.log('Uploading permanent thumb material...');
        const thumbId = await addPermanentMaterial(token);
        console.log(`Thumb media_id: ${thumbId}`);

        console.log('Creating draft...');
        const result = await createDraft(token, title, htmlContent, config.author || '', thumbId);
        console.log('Draft created successfully!');
        console.log(`Media ID: ${result.media_id}`);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

main();
