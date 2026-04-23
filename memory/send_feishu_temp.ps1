$headers = @{"Content-Type" = "application/json"}
$body = @{
    chat_id = "ou_1b35a7e08c18ad9df24f0491eb2f06e6"
    msg_type = "text"
    content = @{
        text = "【📊 每日爆款视频】今日各平台热门参考

🔥 B站热门
1. 《崩坏：星穹铁道》银狼LV.999角色PV——「我独自满级」
2. 口技表演《三打白骨精》
3. 「每次生日许的愿 其实都与你有关」2.0
4. 见面5秒开始战斗
5. 洛天依 原创《告死鸟》
6. 当你穿进老钱班22
7. 刘巳道重拍《哭声》：怀疑即有罪，神明皆恶鬼
8. 重庆|如画一般
9. 《异环》公测PV丨Play on！
10. 【奇迹男孩1998】我的最新作品

🎵 抖音热点
1. 首条视频破播放量3000万，3月榜单现象级新人
2. 2026年抖音涨粉排行榜前十名
3. 4月份抖音热榜
4. 2026爆款音乐合集

📱 快手热门
1. 快手短视频主播排行榜2026前十名
2. 2026快手搜索排名置顶技巧
3. 口播类视频平均获赞5w+

选好后告诉我，我帮你生成拍摄脚本和素材方案 🎬"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method Post -Headers $headers -Body $body -Encoding utf8
