WV.DATA.scenes["hill_rock"] = {
 "key": "hill_rock",
 "name": "巨石坡",
 "music": "bgm_forest",
 "outdoor": true,
 "portals": [
  {
   "name": "去精灵秘境",
   "x": 360,
   "y": 90,
   "r": 16,
   "to": "spirit_realm"
  },
  {
   "name": "回花田",
   "x": 20,
   "y": 195,
   "r": 16,
   "to": "hill_flower"
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
   "name": "石头爷爷",
   "x": 200,
   "y": 103,
   "r": 11,
   "action": "spirit_stone"
  },
  {
   "name": "去精灵秘境",
   "x": 360,
   "y": 90,
   "r": 16,
   "action": "goto_spirit_realm"
  },
  {
   "name": "回花田",
   "x": 20,
   "y": 195,
   "r": 16,
   "action": "goto_hill_flower"
  }
 ]
};
