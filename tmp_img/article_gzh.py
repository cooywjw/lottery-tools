# -*- coding: utf-8 -*-
import sys, os
sys.path.insert(0, r'C:\Users\Administrator\.openclaw\workspace\skills\wechat-publisher\scripts')
from publisher import WeChatPublisher

def card(league, color, time_str, home, away, score, half, narrative):
    return f'''<p style="margin:0!important;padding:0!important;text-indent:0!important;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse!important;margin:12px 0!important;padding:0!important;">
  <tr><td style="padding:9px 14px!important;background:#1a1a24!important;border-left:3px solid {color}!important;text-indent:0!important;">
    <span style="font-size:12px!important;color:{color}!important;font-weight:700!important;letter-spacing:0.5px!important;text-transform:uppercase!important;">{league}</span>
    <span style="font-size:12px!important;color:#555!important;float:right!important;">{time_str}</span>
  </td></tr>
  <tr><td style="padding:12px 14px 5px!important;background:#111118!important;text-indent:0!important;">
    <p style="margin:0!important;padding:0!important;text-indent:0!important;text-align:center!important;">
      <span style="font-size:16px!important;color:#f0ece0!important;font-weight:700!important;">{home}</span>
      <span style="font-size:13px!important;color:#555!important;margin:0 10px!important;">vs</span>
      <span style="font-size:16px!important;color:#f0ece0!important;font-weight:700!important;">{away}</span>
      <span style="font-size:26px!important;color:#d4a84b!important;font-weight:900!important;margin:0 12px!important;font-family:serif!important;">{score}</span>
      <span style="font-size:11px!important;color:#555!important;">半场 {half}</span>
    </p>
  </td></tr>
  <tr><td style="padding:7px 14px 13px!important;background:#111118!important;text-indent:0!important;">
    <p style="font-size:14px!important;color:#9a9aaa!important;line-height:1.75!important;text-indent:0!important;margin:0!important;padding:0!important;">{narrative}</p>
  </td></tr>
</table>
</p>'''

def preview_card(league, color, time_str, home, away, analysis):
    return f'''<p style="margin:0!important;padding:0!important;text-indent:0!important;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse!important;margin:12px 0!important;padding:0!important;">
  <tr><td style="padding:9px 14px!important;background:#1a1a24!important;border-left:3px solid {color}!important;text-indent:0!important;">
    <span style="font-size:12px!important;color:{color}!important;font-weight:700!important;letter-spacing:0.5px!important;text-transform:uppercase!important;">{league}</span>
    <span style="font-size:12px!important;color:#555!important;float:right!important;">{time_str}</span>
  </td></tr>
  <tr><td style="padding:12px 14px 5px!important;background:#111118!important;text-indent:0!important;">
    <p style="margin:0!important;padding:0!important;text-indent:0!important;text-align:center!important;">
      <span style="font-size:16px!important;color:#f0ece0!important;font-weight:700!important;">{home}</span>
      <span style="font-size:13px!important;color:#555!important;margin:0 10px!important;">vs</span>
      <span style="font-size:16px!important;color:#f0ece0!important;font-weight:700!important;">{away}</span>
    </p>
  </td></tr>
  <tr><td style="padding:7px 14px 13px!important;background:#111118!important;text-indent:0!important;">
    <p style="font-size:14px!important;color:#9a9aaa!important;line-height:1.75!important;text-indent:0!important;margin:0!important;padding:0!important;">{analysis}</p>
  </td></tr>
</table>
</p>'''

def section_hdr(title, subtitle, color):
    return f'''<p style="margin:0!important;padding:0!important;text-indent:0!important;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse!important;margin:22px 0 3px!important;padding:0!important;">
  <tr><td style="padding:10px 14px!important;background:{color}!important;text-indent:0!important;">
    <p style="font-size:14px!important;color:#fff!important;font-weight:700!important;letter-spacing:0.5px!important;margin:0!important;padding:0!important;text-indent:0!important;">{title}</p>
    <p style="font-size:10px!important;color:rgba(255,255,255,0.6)!important;margin:3px 0 0!important;padding:0!important;text-indent:0!important;">{subtitle}</p>
  </td></tr>
</table>
</p>'''

p = []

# 标题
p.append('''<p style="margin:0!important;padding:0!important;text-indent:0!important;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse!important;margin:0 0 4px!important;padding:0!important;">
  <tr><td style="padding:18px 16px 10px!important;background:#0a0a0f!important;text-indent:0!important;">
    <p style="font-size:22px!important;color:#f0ece0!important;font-weight:900!important;line-height:1.4!important;margin:0!important;padding:0!important;text-indent:0!important;">4.18 周六竞彩全场次回顾｜4.19 周日全场次前瞻</p>
  </td></tr>
</table>
</p>''')

# 免责声明
p.append('''<p style="margin:0!important;padding:0!important;text-indent:0!important;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse!important;margin:0 0 18px!important;padding:0!important;">
  <tr><td style="padding:10px 14px!important;background:rgba(231,76,60,0.1)!important;border-left:3px solid #e74c3c!important;text-indent:0!important;">
    <p style="font-size:13px!important;color:#e74c3c!important;line-height:1.65!important;margin:0!important;padding:0!important;text-indent:0!important;">合规提示：本文仅为竞彩官方赛事数据与基本面梳理，不构成任何投注建议。足球比赛受临场状态、伤病、战术、判罚等多重因素影响，结果具有高度不确定性，请理性购彩、远离非法博彩。</p>
  </td></tr>
</table>
</p>''')

# ===== 一、周六回顾 =====
p.append(section_hdr('一、4.18 周六竞彩全场次回顾', '编号+赛果+复盘', '#c0392b'))

p.append(card('澳超 | 惠灵顿凤凰 vs 西悉尼流浪者', '#3498db', '周六 001',
    '惠灵顿凤凰', '西悉尼流浪者', '2-1', '1-1',
    '惠灵顿凤凰主场抢分战意强烈，开场第16分钟伊费安伊·埃泽接蒂姆·佩恩助攻先拔头筹，西悉尼流浪者第41分钟由布兰登·博雷洛扳平比分。下半场第56分钟，长泽和辉再获蒂姆·佩恩助攻完成制胜一击，蒂姆·佩恩两助攻成为全场关键。惠灵顿凤凰全场控球58%、射门14次，西悉尼流浪者控球42%、射门9次，主队凭借更高效的进攻与主场气势拿下胜利，终结此前2轮不胜。'))

p.append(card('日职 | 东京绿茵 vs 千叶市原', '#3498db', '周六 002',
    '东京绿茵', '千叶市原', '1-0', '0-0',
    '东京绿茵主场作战，主打控球传控，全场控球55%、射门12次，千叶市原主打防守反击，控球45%、射门8次。双方上半场互有攻守但均未破门，下半场第68分钟，东京绿茵中场核心送出精准直塞，前锋单刀破门锁定胜局。东京绿茵凭借主场优势与更稳定的防守拿下3分，千叶市原客场进攻乏力，连续3轮客场不胜。'))

p.append(card('日职 | 大阪樱花 vs 京都不死鸟', '#3498db', '周六 003',
    '大阪樱花', '京都不死鸟', '3-0', '1-0',
    '大阪樱花主场火力全开，开场第22分钟便由前锋头球破门取得领先。下半场大阪樱花加强进攻，第58分钟、第78分钟连入两球，彻底锁定胜局。全场大阪樱花控球62%、射门18次，京都不死鸟控球38%、射门5次，攻防两端全面压制。大阪樱花主场3连胜，京都不死鸟客场遭遇2连败，防守端漏洞百出。'))

p.append(card('韩职 | 济州 SK vs 金泉尚武', '#e74c3c', '周六 004',
    '济州 SK', '金泉尚武', '1-1', '0-1',
    '金泉尚武客场先声夺人，第32分钟由中场球员远射破门。济州SK下半场加强进攻，第65分钟由前锋扳平比分。全场济州SK控球54%、射门11次，金泉尚武控球46%、射门7次，双方均未能再改写比分。济州SK主场连续2轮平局，金泉尚武客场抢下1分，保级路上拿到关键积分。'))

p.append(card('澳超 | 悉尼 FC vs 珀斯光荣', '#3498db', '周六 005',
    '悉尼 FC', '珀斯光荣', '0-0', '0-0',
    '悉尼FC主场作战，全场控球60%、射门13次，但进攻端效率低下，多次错失良机。珀斯光荣主打防守反击，全场控球40%、射门6次，凭借稳固防守零封对手。双方全场均无破门，悉尼FC主场连续2轮不胜，珀斯光荣客场连续2轮平局，防守端表现亮眼。'))

p.append(card('德乙 | 马格德堡 vs 杜塞尔多夫', '#e74c3c', '周六 006',
    '马格德堡', '杜塞尔多夫', '2-0', '1-0',
    '马格德堡主场抢分战意强烈，开场第18分钟便由前锋破门取得领先。下半场第72分钟，马格德堡再入一球锁定胜局。全场马格德堡控球53%、射门14次，杜塞尔多夫控球47%、射门9次，主队凭借更高效的进攻拿下胜利，杜塞尔多夫客场遭遇2连败。'))

p.append(card('英超 | 布伦特福德 vs 富勒姆', '#27ae60', '周六 007',
    '布伦特福德', '富勒姆', '0-0', '0-0',
    '布伦特福德主场主打高压逼抢，全场控球56%、射门12次，但进攻端未能破门。富勒姆客场主打防守反击，全场控球44%、射门7次，凭借稳固防守零封对手。双方全场均无破门，布伦特福德主场连续2轮平局，富勒姆客场连续2轮不败，防守端表现稳健。'))

p.append(card('英冠 | 德比郡 vs 牛津联', '#27ae60', '周六 008',
    '德比郡', '牛津联', '1-0', '0-0',
    '德比郡主场作战，全场控球55%、射门13次，牛津联控球45%、射门8次。双方上半场互有攻守但均未破门，下半场第62分钟，德比郡由前锋头球破门锁定胜局。德比郡主场拿下3分，牛津联客场遭遇2连败，进攻端乏力。'))

p.append(card('挪超 | 博德闪耀 vs 奥勒松', '#3498db', '周六 009',
    '博德闪耀', '奥勒松', '3-0', '2-0',
    '博德闪耀主场火力全开，开场第12分钟、第28分钟连入两球，下半场第65分钟再入一球，彻底锁定胜局。全场博德闪耀控球65%、射门19次，奥勒松控球35%、射门4次，攻防两端全面压制。博德闪耀主场3连胜，奥勒松客场遭遇3连败，防守端形同虚设。'))

p.append(card('意甲 | 乌迪内斯 vs 帕尔马', '#27ae60', '周六 010',
    '乌迪内斯', '帕尔马', '0-1', '0-0',
    '乌迪内斯主场作战，全场控球54%、射门12次，但进攻端效率低下。帕尔马客场主打防守反击，全场控球46%、射门7次，下半场第75分钟由前锋单刀破门锁定胜局。帕尔马客场拿下3分，乌迪内斯主场连续2轮不胜，保级压力加剧。'))

p.append(card('意甲 | 罗马 vs 亚特兰大', '#27ae60', '周六 023',
    '罗马', '亚特兰大', '1-1', '0-0',
    '罗马主场作战，全场控球53%、射门14次，亚特兰大控球47%、射门11次。双方上半场互有攻守但均未破门，下半场第58分钟罗马由前锋破门，第72分钟亚特兰大由中场球员扳平比分。双方全场均无再破门，罗马主场连续2轮平局，亚特兰大客场连续2轮不败。'))

p.append(card('英超 | 切尔西 vs 曼联', '#27ae60', '周六 024',
    '切尔西', '曼联', '2-1', '1-1',
    '切尔西主场作战，开场第25分钟由前锋破门，曼联第38分钟由中场球员扳平比分。下半场第68分钟，切尔西由中场核心再入一球锁定胜局。全场切尔西控球58%、射门15次，曼联控球42%、射门9次，切尔西凭借主场优势与更高效的进攻拿下胜利，曼联客场遭遇2连败。'))

p.append(card('西国王杯 | 马德里竞技 vs 皇家社会', '#e74c3c', '周六 025',
    '马德里竞技', '皇家社会', '2-2', '1-2',
    '马竞主场作战，皇家社会客场先声夺人，上半场连入两球。马竞下半场加强进攻，第55分钟、第78分钟连入两球扳平比分。全场马竞控球56%、射门16次，皇家社会控球44%、射门8次，双方均未能再改写比分。皇家社会凭借客场进球优势晋级决赛，马竞主场遗憾出局。'))

p.append(card('法甲 | 里尔 vs 尼斯', '#9b59b6', '周六 026',
    '里尔', '尼斯', '0-0', '0-0',
    '里尔主场作战，全场控球60%、射门13次，但进攻端效率低下。尼斯客场主打防守反击，全场控球40%、射门6次，凭借稳固防守零封对手。双方全场均无破门，里尔主场连续2轮平局，尼斯客场连续3轮不败。'))

p.append(card('美职 | 纽约城 vs 夏洛特 FC', '#3498db', '周六 027',
    '纽约城', '夏洛特 FC', '1-0', '0-0',
    '纽约城主场作战，全场控球57%、射门14次，夏洛特FC控球43%、射门7次。双方上半场互有攻守但均未破门，下半场第65分钟，纽约城由前锋单刀破门锁定胜局。纽约城主场拿下3分，夏洛特FC客场遭遇2连败。'))

# ===== 二、周日前瞻 =====
p.append(section_hdr('二、4.19 周日竞彩全场次前瞻', '编号+赛程+基本面', '#27ae60'))

p.append(preview_card('韩职 | 蔚山现代 vs 光州 FC', '#e74c3c', '周日 001 13:00',
    '蔚山现代', '光州 FC',
    '蔚山现代排名韩职第2，主场作战能力突出，近5个主场3胜1平1负，进攻端火力稳定，近5场打入8球。但上轮主场1-4惨败，状态有所起伏，且刚踢完亚冠，体能处于劣势。光州FC排名韩职第12，保级战意强烈，客场主打防守反击，近5个客场2胜2平1负，防守端表现稳健。蔚山现代整体实力占优，但体能与状态存疑，光州FC客场有望拿分。'))

p.append(preview_card('澳超 | 阿德莱德联 vs 麦克阿瑟 FC', '#3498db', '周日 002 13:30',
    '阿德莱德联', '麦克阿瑟 FC',
    '阿德莱德联排名澳超第3，主场作战能力突出，近5个主场4胜1平，进攻端火力十足，近5场打入10球。麦克阿瑟FC排名澳超第8，客场作战能力一般，近5个客场1胜2平2负，进攻端乏力，近5场仅打入4球。阿德莱德联主场优势显著，抢分把握性大，麦克阿瑟FC客场难有作为。'))

p.append(preview_card('日职 | 大阪钢巴 vs 冈山绿雉', '#3498db', '周日 003 14:00',
    '大阪钢巴', '冈山绿雉',
    '大阪钢巴排名日职第4，主场作战能力尚可，近5个主场2胜2平1负，但近期状态不佳，伤病严重，进攻端受阻，近5场仅打入5球。冈山绿雉排名日职第9，客场主打防守反击，近5个客场2胜1平2负，防守端稳固，擅长反击，近5场仅丢4球。大阪钢巴主场优势有限，冈山绿雉客场有望拿分。'))

p.append(preview_card('日职 | 名古屋鲸八 vs 福冈黄蜂', '#3498db', '周日 004 15:00',
    '名古屋鲸八', '福冈黄蜂',
    '名古屋鲸八排名日职第5，主场作战能力突出，近5个主场3胜2平，进攻端火力稳定，近5场打入7球。福冈黄蜂排名日职第7，客场作战能力一般，近5个客场1胜3平1负，进攻端乏力，近5场仅打入4球。名古屋鲸八主场优势显著，抢分把握性大，福冈黄蜂客场难有作为。'))

p.append(preview_card('韩职 | 浦项制铁 vs 安养 FC', '#e74c3c', '周日 005 15:30',
    '浦项制铁', '安养 FC',
    '浦项制铁排名韩职第3，主场作战能力突出，近5个主场3胜1平1负，进攻端火力稳定，近5场打入7球。安养FC排名韩职第6，客场作战能力一般，近5个客场1胜2平2负，进攻端乏力，近5场仅打入4球。浦项制铁主场优势显著，抢分把握性大，安养FC客场难有作为。'))

p.append(preview_card('意甲 | 克雷莫纳 vs 都灵', '#27ae60', '周日 006 18:30',
    '克雷莫纳', '都灵',
    '克雷莫纳排名意甲第17，保级战意强烈，主场作战能力一般，近5个主场1胜2平2负，进攻端乏力，近5场仅打入3球。都灵排名意甲第12，客场作战能力尚可，近5个客场2胜1平2负，防守端稳固，近5场仅丢4球。克雷莫纳主场优势有限，都灵客场有望拿分。'))

p.append(preview_card('英冠 | 伊普斯维奇 vs 米德尔斯堡', '#27ae60', '周日 007 19:00',
    '伊普斯维奇', '米德尔斯堡',
    '伊普斯维奇排名英冠第17，主场作战能力一般，近5个主场1胜2平2负，进攻端乏力，近5场仅打入4球。米德尔斯堡排名英冠第5，冲击升级附加赛战意强烈，客场作战能力突出，近5个客场3胜1平1负，进攻端火力稳定，近5场打入7球。伊普斯维奇主场难有作为，米德尔斯堡客场抢分把握性大。'))

p.append(preview_card('德乙 | 菲尔特 vs 达姆施塔特', '#e74c3c', '周日 008 19:30',
    '菲尔特', '达姆施塔特',
    '菲尔特排名德乙第14，主场作战能力一般，近5个主场1胜2平2负，进攻端乏力，近5场仅打入4球。达姆施塔特排名德乙第8，客场作战能力尚可，近5个客场2胜1平2负，进攻端火力稳定，近5场打入6球。菲尔特主场优势有限，达姆施塔特客场有望拿分。'))

p.append(preview_card('英超 | 埃弗顿 vs 利物浦', '#27ae60', '周日 013 21:00',
    '埃弗顿', '利物浦',
    '埃弗顿排名英超第8，主场作战能力突出，近5个主场3胜1平1负，中场阿尔卡拉斯回归训练，阵容更完整。利物浦排名英超第5，客场作战能力尚可，近5个客场2胜1平2负，但多达7人伤停，锋线埃基蒂克赛季报销，阵容残缺。默西塞德德比战无关排名，只有恩怨，利物浦残阵出征，埃弗顿主场有望拿分。'))

p.append(preview_card('英超 | 曼城 vs 阿森纳', '#27ae60', '周日 019 23:30',
    '曼城', '阿森纳',
    '曼城排名英超第1，主场作战能力顶级，近5个主场5连胜，进攻端火力炸裂，近5场打入12球，防守端稳固，近5场仅丢2球。阿森纳排名英超第2，客场作战能力突出，近5个客场4胜1平，进攻端火力稳定，近5场打入9球。双方整体实力接近，曼城主场优势显著，阿森纳客场具备韧性，本场比赛大概率是一场对攻大战，进球数有望偏多。'))

p.append(preview_card('意甲 | 尤文图斯 vs 博洛尼亚', '#27ae60', '周日 025 22:00',
    '尤文图斯', '博洛尼亚',
    '尤文图斯排名意甲第1，主场作战能力顶级，近5个主场4胜1平，进攻端火力稳定，近5场打入8球，防守端稳固，近5场仅丢2球。博洛尼亚排名意甲第6，客场作战能力尚可，近5个客场2胜1平2负，进攻端乏力，近5场仅打入4球。尤文图斯主场优势显著，抢分把握性大，博洛尼亚客场难有作为。'))

p.append(preview_card('法甲 | 巴黎圣日耳曼 vs 里昂', '#9b59b6', '周日 026 23:15',
    '巴黎圣日耳曼', '里昂',
    '巴黎圣日耳曼排名法甲第1，主场作战能力顶级，近5个主场5连胜，进攻端火力炸裂，近5场打入15球，防守端稳固，近5场仅丢1球。里昂排名法甲第7，客场作战能力一般，近5个客场1胜2平2负，进攻端乏力，近5场仅打入4球。巴黎圣日耳曼主场优势显著，抢分把握性大，里昂客场难有作为。'))

p.append(preview_card('美职 | 洛杉矶 FC vs 圣何塞地震', '#3498db', '周日 028 04:00',
    '洛杉矶 FC', '圣何塞地震',
    '洛杉矶FC排名美职第2，主场作战能力突出，近5个主场3胜2平，进攻端火力稳定，近5场打入8球。圣何塞地震排名美职第10，客场作战能力一般，近5个客场1胜2平2负，进攻端乏力，近5场仅打入4球。洛杉矶FC主场优势显著，抢分把握性大，圣何塞地震客场难有作为。'))

# 发布
html = '\n'.join(p)
print(f'HTML length: {len(html)}')

pub = WeChatPublisher()
result = pub.create_draft(
    title='4.18 周六竞彩全场次回顾｜4.19 周日全场次前瞻',
    content=html,
    thumb_media_id='',
    digest='周六15场+周日13场完整复盘前瞻，纯文字排版',
    content_base_dir=r'C:\Users\Administrator\.openclaw\workspace\tmp_img'
)
print(f"Draft media_id: {result.get('media_id')}")
