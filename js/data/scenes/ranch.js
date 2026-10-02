WV.DATA.scenes["ranch"] = {
 "key": "ranch",
 "name": "风铃谷·牧场",
 "music": "bgm_town",
 "outdoor": true,
 "portals": [
  {
   "name": "回镇街",
   "x": 30,
   "y": 195,
   "r": 16,
   "to": "town_street"
  }
 ],
 "npcs": [
  {
   "id": "huahua",
   "x": 110,
   "y": 130
  }
 ],
 "props": [],
 "size": [
  384,
  216
 ],
 "hotspots": [
  {
   "name": "牧场小屋",
   "x": 90,
   "y": 86,
   "r": 32,
   "action": "shop_ranch"
  },
  {
   "name": "鸡舍",
   "x": 230,
   "y": 147,
   "r": 7,
   "action": "chicken_quest"
  },
  {
   "name": "牛棚",
   "x": 320,
   "y": 148,
   "r": 9,
   "action": "cow"
  },
  {
   "name": "回镇街",
   "x": 30,
   "y": 195,
   "r": 16,
   "action": "goto_town_street"
  }
 ]
};
