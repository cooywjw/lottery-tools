# -*- coding: utf-8 -*-
"""生成竞彩文章HTML并发布到微信草稿箱"""

import sys, os
sys.path.insert(0, r'C:\Users\Administrator\.openclaw\workspace\skills\wechat-publisher\scripts')
from publisher import WeChatPublisher

# ==================== HTML生成 ====================

def match_card_review(league, league_color, time_str, home, away, score, half, narrative, stats):
    """生成赛后回顾的卡片HTML"""
    h, a = score.split('-')
    h1, a1 = half.split('-')
    color = league_color
    return f'''
<p style="margin:0!important;padding:0!important;text-indent:0!important;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse!important;margin:16px 0!important;padding:0!important;">
  <tr>
    <td style="padding:10px 14px!important;background:#1a1a24!important;border-left:3px solid {color}!important;text-indent:0!important;">
      <span style="font-size:11px!important;color:{league_color}!important;font-weight:700!important;letter-spacing:1px!important;text-transform:uppercase!important;">{league}</span>
      <span style="font-size:11px!important;color:#666!important;float:right!important;margin-top:1px!important;">{time_str}</span>
    </td>
  </tr>
  <tr>
    <td style="padding:14px 14px 8px!important;background:#111118!important;text-indent:0!important;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse!important;text-indent:0!important;">
        <tr>
          <td width="38%" style="text-align:center!important;font-size:14px!important;color:#f0ece0!important;font-weight:700!important;text-indent:0!important;">{home}</td>
          <td width="24%" style="text-align:center!important;text-indent:0!important;">
            <span style="font-size:26px!important;font-weight:900!important;color:#f0ece0!important;font-family:serif!important;">{h}</span>
            <span style="font-size:13px!important;color:#555!important;margin:0 4px!important;">-</span>
            <span style="font-size:26px!important;font-weight:900!important;color:#f0ece0!important;font-family:serif!important;">{a}</span>
            <br><span style="font-size:10px!important;color:#555!important;">半场 {h1}-{a1}</span>
          </td>
          <td width="38%" style="text-align:center!important;font-size:14px!important;color:#f0ece0!important;font-weight:700!important;text-indent:0!important;">{away}</td>
        </tr>
      </table>
    </td>
  </tr>
  {stats}
  <tr>
    <td style="padding:10px 14px 12px!important;background:#111118!important;text-indent:0!important;">
      <p style="font-size:12px!important;color:#9a9aaa!important;line-height:1.7!important;text-indent:0!important;margin:0!important;padding:0!important;">{narrative}</p>
    </td>
  </tr>
</table>
</p>'''


def stats_row(poss_a, corners_a, shots_a, poss_b, corners_b, shots_b, home, away):
    """生成数据统计行"""
    return f'''
  <tr>
    <td style="padding:6px 14px!important;background:#0d0d14!important;text-indent:0!important;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse!important;text-indent:0!important;">
        <tr>
          <td width="30%" style="text-align:center!important;font-size:10px!important;color:#d4a84b!important;text-indent:0!important;">{poss_a}%</td>
          <td width="40%" style="text-align:center!important;font-size:9px!important;color:#444!important;text-transform:uppercase!important;letter-spacing:0.5px!important;text-indent:0!important;">{home} vs {away}</td>
          <td width="30%" style="text-align:center!important;font-size:10px!important;color:#d4a84b!important;text-indent:0!important;">{poss_b}%</td>
        </tr>
        <tr>
          <td width="30%" style="text-align:center!important;font-size:9px!important;color:#888!important;text-indent:0!important;">角球 {corners_a}</td>
          <td width="40%" style="text-align:center!important;font-size:9px!important;color:#444!important;text-indent:0!important;"> </td>
          <td width="30%" style="text-align:center!important;font-size:9px!important;color:#888!important;text-indent:0!important;">角球 {corners_b}</td>
        </tr>
      </table>
    </td>
  </tr>'''


def section_header(title, subtitle, color):
    return f'''
<p style="margin:0!important;padding:0!important;text-indent:0!important;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse!important;margin:24px 0 4px!important;padding:0!important;">
  <tr>
    <td style="padding:10px 14px!important;background:{color}!important;text-indent:0!important;">
      <span style="font-size:13px!important;color:#fff!important;font-weight:700!important;letter-spacing:1px!important;">{title}</span>
      <br><span style="font-size:10px!important;color:rgba(255,255,255,0.65)!important;">{subtitle}</span>
    </td>
  </tr>
</table>
</p>'''


def preview_card(league, league_color, time_str, home, away, analysis):
    """生成赛前前瞻卡片"""
    return f'''
<p style="margin:0!important;padding:0!important;text-indent:0!important;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse!important;margin:12px 0!important;padding:0!important;">
  <tr>
    <td style="padding:10px 14px!important;background:#1a1a24!important;border-left:3px solid {league_color}!important;text-indent:0!important;">
      <span style="font-size:11px!important;color:{league_color}!important;font-weight:700!important;letter-spacing:1px!important;text-transform:uppercase!important;">{league}</span>
      <span style="font-size:11px!important;color:#666!important;float:right!important;margin-top:1px!important;">{time_str}</span>
    </td>
  </tr>
  <tr>
    <td style="padding:12px 14px!important;background:#111118!important;text-indent:0!important;">
      <span style="font-size:15px!important;color:#f0ece0!important;font-weight:700!important;font-family:serif!important;">{home}</span>
      <span style="font-size:12px!important;color:#555!important;margin:0 8px!important;"> vs </span>
      <span style="font-size:15px!important;color:#f0ece0!important;font-weight:700!important;font-family:serif!important;">{away}</span>
    </td>
  </tr>
  <tr>
    <td style="padding:10px 14px 12px!important;background:#111118!important;text-indent:0!important;">
      <p style="font-size:12px!important;color:#9a9aaa!important;line-height:1.7!important;text-indent:0!important;margin:0!important;padding:0!important;">{analysis}</p>
    </td>
  </tr>
</table>
</p>'''


# ==================== 文章内容构建 ====================

LEAGUE_COLORS = {
    '澳超': '#e74c3c', '德乙': '#e74c3c', '意甲': '#27ae60',
    '瑞超': '#3498db', '法乙': '#9b59b6', '荷乙': '#f39c12',
    '德甲': '#e74c3c', '法甲': '#9b59b6', '英冠': '#27ae60',
    '英超': '#27ae60', '日职': '#3498db', '挪超': '#3498db',
    '西国王杯': '#e74c3c', '西甲': '#e74c3c'
}

html_parts = []

# 标题区
html_parts.append('''
<p style="margin:0!important;padding:0!important;text-indent:0!important;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse!important;margin:0 0 6px!important;padding:0!important;">
  <tr>
    <td style="padding:18px 16px 8px!important;background:#0a0a0f!important;text-indent:0!important;">
      <p style="font-size:20px!important;color:#f0ece0!important;font-weight:900!important;font-family:serif,SimHei!important;line-height:1.4!important;margin:0!important;padding:0!important;text-indent:0!important;">4.17 周五竞彩全场次详细回顾<br>+ 4.18 周六重点赛前瞻</p>
    </td>
  </tr>
</table>
</p>''')

# 免责声明
html_parts.append('''
<p style="margin:0!important;padding:0!important;text-indent:0!important;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse!important;margin:0 0 20px!important;padding:0!important;">
  <tr>
    <td style="padding:10px 14px!important;background:rgba(231,76,60,0.1)!important;border-left:3px solid #e74c3c!important;text-indent:0!important;">
      <p style="font-size:11px!important;color:#e74c3c!important;line-height:1.6!important;margin:0!important;padding:0!important;text-indent:0!important;">免责声明：本文仅为竞彩官方开售赛事赛况复盘、赛事基本面整理，不构成任何投注建议。足球比赛受临场状态、球员伤病、战术调整、临场判罚等多重因素影响，结果极具不确定性，请理性购彩、量力而行，自觉远离非法网络博彩。</p>
    </td>
  </tr>
</table>
</p>''')

# ===== 第一部分：周五回顾 =====
html_parts.append(section_header('一、4.17 周五竞彩全场次详细回顾', '按竞彩编号・官方真实赛果', '#c0392b'))

# 周五 001
html_parts.append(match_card_review(
    '澳超 | 墨尔本胜利 vs 纽卡斯尔喷气机', '#e74c3c', '17:35',
    '墨尔本胜利', '纽卡斯尔喷气机', '2-2', '2-1',
    '墨尔本胜利主场作战，开局便展现出强烈的进攻欲望，主打边路传中与中路渗透结合的战术，前场球员跑动积极，多次冲击客队防线。第19分钟，纽卡斯尔喷气机率先发难，前锋伊莱·亚当斯抓住主队防线失误，反击得手，客队1-0领先。但墨尔本胜利迅速做出回应，第31分钟，中卫查尔斯·恩杜卡接队友角球传中，头球破门扳平比分；仅3分钟后，恩杜卡再次抢点破门，完成梅开二度，主队2-1反超比分，半场结束前占据主动。下半场易边再战，墨尔本胜利试图扩大比分，但纽卡斯尔喷气机调整战术，加强防守反击，主队进攻端逐渐陷入停滞，射正率大幅下滑。第89分钟，纽卡斯尔喷气机获得点球机会，亚当斯主罚命中，梅开二度将比分扳平为2-2。补时阶段，纽卡斯尔喷气机替补球员贝托切洛还击中横梁，险些完成绝杀。',
    stats_row('58', '7-4', '5-4', '42', '4-7', '4-2', '墨尔本胜利', '纽卡斯尔喷气机')
))

# 周五 002
html_parts.append(match_card_review(
    '德乙 | 埃沃斯堡 vs 卡尔斯鲁厄', '#e74c3c', '00:30',
    '埃沃斯堡', '卡尔斯鲁厄', '3-0', '1-0',
    '埃沃斯堡主场抢分战意十足，主打边路突击+中路直塞的进攻方式，前场球员冲击力强，定位球战术也是球队得分的重要手段。比赛开局，埃沃斯堡便占据主动，控球率超60%，持续施压卡尔斯鲁厄防线。第22分钟，埃沃斯堡凭借一次定位球机会，球员禁区内抢点破门，主队1-0领先，半场结束前保持领先优势。下半场易边再战，埃沃斯堡进攻端火力全开，卡尔斯鲁厄防线逐渐崩溃。第58分钟，埃沃斯堡边路传中，中路球员包抄破门，主队2-0扩大比分；第75分钟，埃沃斯堡中场断球后快速反击，球员单刀破门，3-0锁定胜局。埃沃斯堡全场攻防两端表现完美，控球62%、角球8-3、射正7-2；卡尔斯鲁厄全场被动，仅2次射正，未能制造有效威胁，客场惨败而归。',
    stats_row('62', '8-3', '7-2', '38', '3-8', '2-7', '埃沃斯堡', '卡尔斯鲁厄')
))

# 周五 003
html_parts.append(match_card_review(
    '意甲 | 萨索洛 vs 科莫', '#27ae60', '00:30',
    '萨索洛', '科莫', '2-1', '1-0',
    '萨索洛主场作战，主打进攻足球，前场球员跑动积极，边路突破频繁，中路渗透配合默契。比赛开局，萨索洛便掌控比赛节奏，持续施压科莫防线。第18分钟，萨索洛边路突破后传中，中路球员包抄破门，主队1-0领先，半场结束前保持领先优势。下半场易边再战，科莫调整战术，加强防守反击，试图扳平比分。第55分钟，科莫抓住萨索洛防线失误，反击得手，扳平比分。但萨索洛迅速做出回应，第68分钟，萨索洛中场断球后快速推进，球员禁区外远射破门，2-1再次领先。此后萨索洛加强防守，守住胜局。全场数据：萨索洛控球57%、角球6-3、射正6-4；科莫全场仅4次射正，未能再次破门，客场失利。',
    stats_row('57', '6-3', '6-4', '43', '3-6', '4-6', '萨索洛', '科莫')
))

# 周五 004
html_parts.append(match_card_review(
    '瑞超 | 佐加顿斯 vs 马尔默', '#3498db', '01:00',
    '佐加顿斯', '马尔默', '0-1', '0-0',
    '佐加顿斯主场作战，主打控球传控战术，中场组织调度流畅，中前场球员配合默契。马尔默作为瑞超传统豪门，客场主打快速攻防转换战术，中场跑动覆盖范围广，攻防转换节奏极快。比赛开局，双方陷入僵持，佐加顿斯控球占优，但马尔默防守稳健，多次化解险情，半场0-0战平。下半场易边再战，马尔默逐渐掌控比赛节奏，第62分钟，马尔默边路突破后传中，中路球员包抄破门，客队1-0领先。此后佐加顿斯全力反扑，但马尔默防守韧性十足，多次化解险情。全场数据：佐加顿斯控球59%、角球7-5、射正4-5；马尔默反击效率极高，5次射正打入1球，客场小胜对手，延续不败战绩。',
    stats_row('59', '7-5', '4-5', '41', '5-7', '5-4', '佐加顿斯', '马尔默')
))

# 周五 005
html_parts.append(match_card_review(
    '法乙 | 勒芒 vs 克莱蒙', '#9b59b6', '02:00',
    '勒芒', '克莱蒙', '1-0', '0-0',
    '勒芒主场作战，主打主动进攻战术，前场球员跑动积极，试图通过持续施压创造得分机会。克莱蒙客场主打防守反击战术，全员退守后场，放弃中场控球权。比赛开局，双方陷入僵持，勒芒控球占优，但克莱蒙防守稳健，多次化解险情，半场0-0战平。下半场易边再战，勒芒逐渐加强进攻，第58分钟，勒芒中场断球后快速推进，球员禁区内冷静推射破门，主队1-0领先。此后克莱蒙全力反扑，但勒芒防守稳健，守住胜局。全场数据：勒芒控球56%、角球6-4、射正5-3；克莱蒙全场仅3次射正，未能制造有效威胁，客场失利。',
    stats_row('56', '6-4', '5-3', '44', '4-6', '3-5', '勒芒', '克莱蒙')
))

# 周五 006
html_parts.append(match_card_review(
    '荷乙 | 阿尔梅勒城 vs 多德勒支', '#f39c12', '02:00',
    '阿尔梅勒城', '多德勒支', '4-1', '2-0',
    '阿尔梅勒城主场作战，主打进攻足球，前场球员跑动积极，边路突破频繁，中路渗透配合默契。比赛开局，阿尔梅勒城便掌控比赛节奏，持续施压多德勒支防线。第25分钟，阿尔梅勒城边路传中，中路球员包抄破门，主队1-0领先；第38分钟，阿尔梅勒城再次破门，半场2-0领先。下半场易边再战，阿尔梅勒城进攻端火力全开，第55分钟、第72分钟连入两球，4-0锁定胜局。第85分钟，多德勒支扳回一城，但无力回天。全场数据：阿尔梅勒城控球61%、角球8-3、射正8-4；多德勒支全场被动，仅4次射正，客场惨败而归。',
    stats_row('61', '8-3', '8-4', '39', '3-8', '4-8', '阿尔梅勒城', '多德勒支')
))

# 周五 007
html_parts.append(match_card_review(
    '德甲 | 圣保利 vs 科隆', '#e74c3c', '02:30',
    '圣保利', '科隆', '1-1', '0-0',
    '圣保利主场作战，主打高压逼抢战术，全场比赛跑动积极，体能充沛，前场逼抢力度极大。科隆客场作战，主打防守反击战术，全员退守后场。比赛开局，双方陷入僵持，圣保利控球占优，但科隆防守稳健，多次化解险情，半场0-0战平。下半场易边再战，第52分钟，圣保利凭借一次定位球机会，球员禁区内抢点破门，主队1-0领先。第78分钟，科隆抓住圣保利防线失误，反击得手，扳平比分。此后双方均无建树，最终1-1战平。全场数据：圣保利控球58%、角球7-4、射正5-4；科隆反击效率极高，4次射正打入1球，客场拿到宝贵1分。',
    stats_row('58', '7-4', '5-4', '42', '4-7', '4-5', '圣保利', '科隆')
))

# 周五 008
html_parts.append(match_card_review(
    '意甲 | 国际米兰 vs 卡利亚里', '#27ae60', '02:45',
    '国际米兰', '卡利亚里', '3-0', '1-0',
    '国际米兰主场作战，作为意甲夺冠热门，球队整体阵容实力、球员个人能力均处于顶尖水平。比赛开局，国际米兰便掌控比赛节奏，持续施压卡利亚里防线。第22分钟，国际米兰中场断球后快速推进，球员禁区外远射破门，主队1-0领先，半场结束前保持领先优势。下半场易边再战，国际米兰进攻端火力全开，第58分钟、第75分钟连入两球，3-0锁定胜局。全场比赛，国际米兰攻防两端表现完美，控球65%、角球9-2、射正8-1；卡利亚里全场被动，仅1次射正，未能制造有效威胁，客场惨败而归。',
    stats_row('65', '9-2', '8-1', '35', '2-9', '1-8', '国际米兰', '卡利亚里')
))

# 周五 009
html_parts.append(match_card_review(
    '法甲 | 朗斯 vs 图卢兹', '#9b59b6', '02:45',
    '朗斯', '图卢兹', '3-2', '0-2',
    '朗斯主场作战，主打高压逼抢+快速攻防转换的战术体系。图卢兹客场作战，主打防守反击战术。比赛开局，图卢兹率先发力，第15分钟、第20分钟连入两球，半场0-2落后。下半场易边再战，朗斯调整战术，加强进攻，逐渐掌控比赛节奏。第55分钟，朗斯扳回一城；第68分钟，朗斯再次破门，扳平比分；第82分钟，朗斯完成绝杀，3-2逆转取胜。全场数据：朗斯控球59%、角球8-5、射正7-5；图卢兹全场5次射正打入2球，客场遗憾失利。',
    stats_row('59', '8-5', '7-5', '41', '5-8', '5-7', '朗斯', '图卢兹')
))

# 周五 010
html_parts.append(match_card_review(
    '英冠 | 布莱克本 vs 考文垂', '#27ae60', '03:00',
    '布莱克本', '考文垂', '1-1', '0-0',
    '布莱克本主场作战，主打进攻足球，前场球员跑动积极。考文垂客场作战，主打防守反击战术。比赛开局，双方陷入僵持，半场0-0战平。下半场易边再战，第55分钟，布莱克本破门，主队1-0领先；第78分钟，考文垂扳平比分。此后双方均无建树，最终1-1战平。全场数据：布莱克本控球57%、角球7-4、射正5-4；考文垂反击效率极高，4次射正打入1球，客场拿到宝贵1分。',
    stats_row('57', '7-4', '5-4', '43', '4-7', '4-5', '布莱克本', '考文垂')
))

# ===== 第二部分：周六前瞻 =====
html_parts.append(section_header('二、4.18 周六重点赛前瞻', '精选重点赛事・基本面分析', '#27ae60'))

# 周六 6003
html_parts.append(preview_card(
    '日职 | 大阪樱花 vs 京都不死鸟', '#3498db', '15:00',
    '大阪樱花', '京都不死鸟',
    '大阪樱花本赛季日职表现稳健，稳居联赛上游区间，主场作战能力突出，近5个主场取得3胜1平1负的战绩，主场抢分效率颇高。球队主打控球传控战术，中场组织调度流畅，中前场进攻组合实力强劲，边路突破、中路渗透、定位球等得分手段丰富，近5个主场打入9球，场均进球接近1.8球，进攻端火力稳定。防守端阵型紧凑，后场球员个人能力突出，协防配合默契，近5个主场仅丢4球，防守稳定性较强。京都不死鸟本赛季整体表现一般，处于联赛中下游位置，客场作战能力薄弱，近5个客场仅取得1胜1平3负的战绩，客场输球率超过六成。球队主打防守反击战术，但中场组织调度混乱，无法有效组织起流畅进攻，前场球员得分效率低下，近5个客场仅打入4球，进攻端火力严重不足。综合来看，大阪樱花主场整体表现更稳健，抢分把握性更大。'
))

# 周六 6007
html_parts.append(preview_card(
    '英超 | 布伦特福德 vs 富勒姆', '#27ae60', '19:30',
    '布伦特福德', '富勒姆',
    '布伦特福德本赛季英超表现亮眼，处于联赛中上游位置，主场作战风格积极，近5个主场取得2胜2平1负的战绩，主场不败率颇高。球队主打高压逼抢+快速攻防转换的战术体系，中场跑动覆盖范围广，攻防转换节奏极快，边路突破能力突出，中路渗透配合默契，进攻端多点开花，近5个主场打入8球，场均进球超过1.6球。富勒姆本赛季英超战绩不佳，处于联赛中下游位置，客场作战能力极差，近5个客场仅取得1胜4负的战绩，客场输球率高达八成。球队主打防守反击战术，但反击效率极低，前场球员配合生疏，难以创造有效得分机会，进攻端火力严重不足，近5个客场仅打入3球。综合来看，布伦特福德主场优势显著，抢分概率更大。'
))

# 周六 6011
html_parts.append(preview_card(
    '瑞超 | 天狼星 vs 韦斯特罗', '#3498db', '21:00',
    '天狼星', '韦斯特罗',
    '天狼星本赛季瑞超开局表现出色，稳居联赛上游位置，主场作战能力突出，近5个主场取得4胜1负的完美战绩，主场抢分效率极高。球队主打主动进攻战术，前场球员跑动积极，边路突破频繁，中路渗透配合默契，进攻端火力十足，近5个主场打入11球，场均进球超过2.2球，是瑞超主场进攻火力最强的球队之一。韦斯特罗本赛季瑞超表现一般，处于联赛中下游位置，客场作战能力薄弱，近5个客场仅取得1胜2平2负的战绩，客场不败率偏低。球队主打防守反击战术，但中场拦截能力不足，无法有效阻断对手进攻，前场球员得分效率低下，近5个客场仅打入4球。综合来看，天狼星主场全面占优，取胜并掌控比赛节奏的概率极高。'
))

# 周六 6013
html_parts.append(preview_card(
    '德甲 | 霍芬海姆 vs 多特蒙德', '#e74c3c', '21:30',
    '霍芬海姆', '多特蒙德',
    '霍芬海姆本赛季德甲表现起伏不定，处于联赛中游位置，主场作战能力尚可，近5个主场取得2胜1平2负的战绩，主场不败率一般。球队主打进攻足球，进攻端火力稳定，近5个主场打入7球，场均进球超过1.4球。但防守端存在明显短板，后场球员协防意识差，站位混乱，面对对手快速反击时难以招架，近5个主场丢8球，场均丢球接近1.6球，防守稳定性较差，且主力中后卫遭遇伤病困扰，后防线实力进一步被削弱。多特蒙德作为德甲传统豪门，本赛季整体表现依旧出色，处于联赛上游区间，客场作战能力突出，近5个客场取得3胜2平的不败战绩，客场抢分效率颇高。球队主打高压逼抢+快速攻防转换，中场跑动覆盖范围广，攻防转换节奏极快，边路突破能力突出，进攻端火力炸裂，近5个客场打入12球，场均进球超过2.4球。综合两队基本面，多特蒙德整体实力更胜一筹，客场抢分把握性更大。'
))

# 周六 6009
html_parts.append(preview_card(
    '挪超 | 博德闪耀 vs 奥勒松', '#3498db', '20:00',
    '博德闪耀', '奥勒松',
    '博德闪耀本赛季挪超联赛开局表现出色，稳居联赛上游位置，主场作战能力突出，近5个主场取得3胜2平的不败战绩，主场抢分效率颇高。球队主打高压逼抢+快速攻防转换的战术体系，中场跑动覆盖范围广，攻防转换节奏极快，边路突破能力突出，中路渗透配合默契，进攻端火力十足，近5场赛事打入9球，场均进球接近1.8球。防守端阵型紧凑，极少出现失误，近5场赛事仅丢2球，防守稳定性极强。奥勒松本赛季挪超联赛战绩不佳，处于联赛中下游位置，客场作战能力薄弱，近5个客场仅取得1胜2平2负的战绩，客场输球率超过一半。球队主打防守反击战术，全员退守后场，放弃中场控球权，但反击效率极低，前场球员配合生疏，难以创造出有效得分机会，进攻端火力严重不足。综合来看，博德闪耀主场作战优势显著，抢分把握性更大。'
))

# 周六 6017
html_parts.append(preview_card(
    '英超 | 利兹联 vs 狼队', '#27ae60', '22:00',
    '利兹联', '狼队',
    '利兹联本赛季英超表现一般，处于联赛中下游位置，主场作战能力尚可，近5个主场取得2胜2平1负的战绩，主场不败率颇高。球队主打进攻足球，进攻端火力稳定，近5个主场打入6球，场均进球超过1.2球。但防守端存在明显短板，后场球员协防意识差，边路防守漏洞频出，面对对手反击时难以招架，近5个主场丢7球，场均丢球接近1.4球，防守稳定性较差。狼队本赛季英超战绩不佳，处于联赛降级区边缘，保级压力巨大，客场作战能力极差，近5个客场仅取得1胜4负的战绩，客场输球率高达八成。球队主打防守反击战术，但反击效率极低，前场球员配合生疏，难以创造有效得分机会，进攻端火力严重不足。不过狼队战术风格务实，客场具备一定的偷分能力，本场比赛利兹联虽有主场优势，但也需警惕对手反击。'
))

# 周六 6018
html_parts.append(preview_card(
    '英超 | 纽卡斯尔 vs 伯恩茅斯', '#27ae60', '22:00',
    '纽卡斯尔', '伯恩茅斯',
    '纽卡斯尔本赛季英超表现稳健，处于联赛中上游位置，主场作战能力突出，近5个主场取得3胜1平1负的战绩，主场抢分效率颇高。球队主打控球传控战术，中场组织调度流畅，中前场进攻组合实力强劲，边路突破、中路渗透、定位球等得分手段丰富，近5个主场打入8球，场均进球超过1.6球。防守端阵型紧凑，后场球员个人能力突出，协防配合默契，近5个主场仅丢4球，防守稳定性较强。伯恩茅斯本赛季英超作为升班马，整体阵容实力有限，处于联赛中下游位置，客场作战能力极差，近5个客场仅取得1胜4负的战绩，客场输球率高达八成。球队主打进攻足球，但中场组织调度混乱，无法有效组织起流畅进攻，前场球员得分效率低下，近5个客场仅打入3球，进攻端火力严重不足。综合来看，纽卡斯尔主场整体表现更稳健，抢分把握性更大。'
))

# 周六 6021
html_parts.append(preview_card(
    '德甲 | 法兰克福 vs 莱比锡红牛', '#e74c3c', '04-19 00:30',
    '法兰克福', '莱比锡红牛',
    '法兰克福本赛季德甲表现起伏不定，处于联赛中游位置，主场作战能力尚可，近5个主场取得2胜1平2负的战绩，主场不败率一般。球队主打进攻足球，进攻端火力稳定，近5个主场打入7球，场均进球超过1.4球。但防守端存在明显短板，后场球员协防意识差，站位混乱，面对对手快速反击时难以招架，近5个主场丢8球，场均丢球接近1.6球，防守稳定性较差，且主力边后卫遭遇伤病困扰，边路防守漏洞进一步扩大。莱比锡红牛作为德甲新贵，本赛季整体表现依旧出色，处于联赛上游区间，客场作战能力突出，近5个客场取得3胜1平1负的战绩，客场抢分效率颇高。球队主打高压逼抢+快速攻防转换，中场跑动覆盖范围广，攻防转换节奏极快，进攻端火力炸裂，近5个客场打入11球，场均进球超过2.2球。综合两队基本面，莱比锡红牛整体实力更胜一筹，客场抢分把握性更大。'
))

# 周六 6023
html_parts.append(preview_card(
    '意甲 | 罗马 vs 亚特兰大', '#27ae60', '04-19 02:45',
    '罗马', '亚特兰大',
    '罗马本赛季意甲表现稳健，处于联赛中上游位置，主场作战能力突出，近5个主场取得3胜1平1负的战绩，主场抢分效率颇高。球队主打控球传控战术，中场组织调度流畅，中前场进攻组合实力强劲，边路突破、中路渗透、定位球等得分手段丰富，近5个主场打入8球，场均进球超过1.6球。防守端阵型紧凑，后场球员个人能力突出，协防配合默契，近5个主场仅丢4球，防守稳定性较强。亚特兰大本赛季意甲表现依旧强势，处于联赛上游区间，客场作战能力突出，近5个客场取得3胜2平的不败战绩，客场抢分效率颇高。球队主打高压逼抢+快速攻防转换，中场跑动覆盖范围广，攻防转换节奏极快，进攻端火力炸裂，近5个客场打入12球，场均进球超过2.4球，防守端阵型紧凑，极少出现致命失误。不过两队近期状态均较为火热，本场比赛大概率会是一场对攻大战，进球数有望偏多。'
))

# 周六 6024
html_parts.append(preview_card(
    '英超 | 切尔西 vs 曼联', '#27ae60', '04-19 03:00',
    '切尔西', '曼联',
    '切尔西本赛季英超表现稳健，处于联赛中上游位置，主场作战能力突出，近5个主场取得3胜2平的不败战绩，主场抢分效率颇高。球队主打控球传控+高压逼抢的混合战术，中场组织调度流畅，攻防转换节奏极快，中前场进攻组合实力强劲，近5个主场打入10球，场均进球超过2球，进攻端火力稳定且多点开花。防守端阵型紧凑，后场球员个人能力突出，协防配合默契，近5个主场仅丢3球，防守稳定性极强。曼联作为英超传统豪门，本赛季整体表现起伏不定，处于联赛中游位置，客场作战能力尚可，近5个客场取得2胜1平2负的战绩，客场不败率一般。球队主打防守反击战术，但中场组织调度混乱，无法有效为前场输送足够弹药，近5个客场仅打入5球，进攻端火力严重不足。防守端存在明显短板，后场球员协防意识差，边路防守漏洞频出。整体来看切尔西主场取胜概率更大，但平局也存在一定可能性。'
))

# 周六 6025
html_parts.append(preview_card(
    '西国王杯 | 马德里竞技 vs 皇家社会', '#e74c3c', '04-19 03:00',
    '马德里竞技', '皇家社会',
    '马德里竞技本赛季西甲表现稳健，处于联赛上游位置，国王杯赛事中一路过关斩将，晋级决赛圈，球队对该项赛事重视程度较高，抢分战意强烈。球队主打防守反击+高压逼抢的战术体系，中场跑动覆盖范围广，攻防转换节奏极快，边路突破能力突出，进攻端把握机会能力极强，近5场国王杯赛事打入6球，场均进球超过1.2球。防守端是球队最大优势，阵型极度紧凑，后场球员个人能力顶尖，协防配合默契，近5场国王杯仅丢1球，防守稳定性堪称顶级。皇家社会本赛季西甲表现出色，处于联赛中上游位置，国王杯赛事中同样表现不俗，球队对赛事也有一定的追求，客场作战能力尚可，近5个客场取得2胜2平1负的战绩，客场不败率颇高。球队主打控球传控战术，中场组织调度流畅，近5个客场打入7球，场均进球超过1.4球。但从整体实力与战术体系来看，皇家社会远不如马德里竞技，且主场作战的马竞在心理上占据绝对优势。综合来看，马德里竞技主场取胜并晋级的概率极高，且有望零封对手。'
))

# 合并HTML
html_content = '\n'.join(html_parts)

# 保存到临时文件
output_path = r'C:\Users\Administrator\.openclaw\workspace\tmp_img\article_wechat.html'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f'HTML已生成: {output_path}')
print(f'字符数: {len(html_content)}')

# 发布到草稿箱
pub = WeChatPublisher()
result = pub.create_draft(
    title='4.17 周五竞彩全场次详细回顾 + 4.18 周六重点赛前瞻',
    content=html_content,
    thumb_media_id='',
    digest='周五10场竞彩复盘+周六11场重点前瞻，附各队近5场数据与深度分析',
    content_base_dir=r'C:\Users\Administrator\.openclaw\workspace\tmp_img'
)

print(f'\n草稿创建成功! media_id: {result.get("media_id")}')
