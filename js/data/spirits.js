/**
 * spirits.js —— 九只森林精灵（PRD §2.4.3）
 * where: 出现场景；x/y: 场景内坐标；season/night: 出没条件；
 * meet: 相遇对话 [说话人, 文本]；bond: 羁绊事件（item 需求型 / 直接型）
 */
(function () {
  'use strict';
  const WV = window.WV;
  const SP = {
    dingdang: {
      code: 'dingdang', name: '叮当', where: 'home_eaves', x: 250, y: 96,
      desc: '住在奶奶风铃里的风铃草精灵，你的向导与伙伴。',
      meet: [['叮当', '叮铃！我是叮当～']],
      bond: { say: '奶奶说过的那孩子，就是你吧。以后请多关照啦！' },
    },
    acorn: {
      code: 'acorn', name: '橡果团子', where: 'forest_edge', x: 110, y: 95, season: 0,
      desc: '圆滚滚的橡果精灵，成群结队，滚起来咕噜咕噜。',
      meet: [['橡果团子', '咕噜？咕噜噜！'], ['', '（一只圆滚滚的小家伙从橡树后探出头）']],
      bond: { item: 'm_oak', n: 3, say: '咕噜咕噜！（它开心地抱着橡果打滚，把你当做了朋友）' },
    },
    mushroom: {
      code: 'mushroom', name: '蘑菇灯', where: 'deep_inner', x: 180, y: 130, season: 2,
      desc: '雨夜的密林里，一盏一盏亮起来的小灯。',
      meet: [['蘑菇灯', '（轻轻摇晃着帽子，洒下细碎的光）'], ['', '（秋雨的夜里，它们亮得最好看）']],
      bond: { say: '（它在你的掌心停了很久，像一盏小小的、暖暖的灯）' },
    },
    cloudsheep: {
      code: 'cloudsheep', name: '云朵羊', where: 'valley_up', x: 280, y: 55, season: 1,
      desc: '飘在溪谷上空的绵羊云，晴天才能看见。',
      meet: [['云朵羊', '咩————'], ['', '（一朵云抖了抖，原来是一只羊！它慢慢悠悠地飘着）']],
      bond: { say: '（它蹭了蹭你的头顶，软得像一整个晴天）' },
    },
    otter: {
      code: 'otter', name: '溪水獭', where: 'valley_side', x: 200, y: 128,
      desc: '抱着最心爱的鹅卵石不肯撒手的小水獭。',
      meet: [['溪水獭', '（警惕地抱着石头看着你）']],
      bond: { item: 'm_pebble', n: 3, say: '！（它收下了鹅卵石，郑重地把最圆润的那颗回赠给你）' },
    },
    firefly: {
      code: 'firefly', name: '萤火虫群', where: 'forest_edge', x: 200, y: 150, season: 1, night: true,
      desc: '夏夜里流动的星河。',
      meet: [['萤火虫', '（一团温柔的萤光绕着你转了一圈又一圈）']],
      bond: { say: '（它们落在你的发梢和肩上，像戴了一头星星）' },
    },
    stone: {
      code: 'stone', name: '石头爷爷', where: 'hill_rock', x: 200, y: 100,
      desc: '长满青苔的巨石脸，听过整座山谷的故事。',
      meet: [['石头爷爷', '哦……好久没有人类爬到这儿来了。'], ['石头爷爷', '这片山谷的故事，比石头上的青苔还要多。坐下听一会儿吧。']],
      bond: { say: '（它讲了很久很久，从风铃谷的第一枚风铃讲起……你听完时，天都黑了）' },
    },
    snowbunny: {
      code: 'snowbunny', name: '雪兔', where: 'hill_flower', x: 300, y: 140, season: 3, night: true,
      desc: '雪夜里脚印会发光的白兔。',
      meet: [['雪兔', '（一双亮晶晶的眼睛在雪地里望着你，脚印一闪一闪）']],
      bond: { say: '（它跳了两步，回头看你——你跟着它走了一段雪路，心里暖暖的）' },
    },
    belldeer: {
      code: 'belldeer', name: '铃音', where: 'spirit_realm', x: 200, y: 80,
      desc: '谷之守护者。鹿形的巨大精灵，行走时铃音清越。',
      meet: [['铃音', '你终于来了。'], ['铃音', '……不，现在应该叫你「新的守护者」了。']],
      bond: { say: '风铃响起的那天，请替我看看这满谷的四季。' },
    },
  };
  Object.keys(SP).forEach(function (k) { WV.DATA.spirits[k] = SP[k]; });
})();
