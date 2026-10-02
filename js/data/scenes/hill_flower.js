WV.DATA.scenes["hill_flower"] = {
 "key": "hill_flower",
 "name": "山丘花田",
 "music": "bgm_spring",
 "outdoor": true,
 "portals": [
  {
   "name": "回溪谷上坡",
   "x": 20,
   "y": 195,
   "r": 16,
   "to": "valley_up"
  },
  {
   "name": "去巨石坡",
   "x": 360,
   "y": 110,
   "r": 16,
   "to": "hill_rock"
  }
 ],
 "npcs": [],
 "props": [],
 "size": [
  384,
  216
 ],
 "hotspots": [
  {
   "name": "山花丛",
   "x": 120,
   "y": 152,
   "r": 12,
   "action": "gather_flower"
  },
  {
   "name": "月见草（夜间开放）",
   "x": 300,
   "y": 142,
   "r": 12,
   "action": "gather_moonflower"
  },
  {
   "name": "回溪谷上坡",
   "x": 20,
   "y": 195,
   "r": 16,
   "action": "goto_valley_up"
  },
  {
   "name": "去巨石坡",
   "x": 360,
   "y": 110,
   "r": 16,
   "action": "goto_hill_rock"
  }
 ]
};
