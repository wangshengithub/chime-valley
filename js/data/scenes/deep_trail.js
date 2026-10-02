WV.DATA.scenes["deep_trail"] = {
 "key": "deep_trail",
 "name": "密林小径",
 "music": "bgm_forest",
 "outdoor": true,
 "portals": [
  {
   "name": "去密林深处",
   "x": 360,
   "y": 110,
   "r": 16,
   "to": "deep_inner"
  },
  {
   "name": "回森林边缘",
   "x": 20,
   "y": 195,
   "r": 16,
   "to": "forest_edge"
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
   "name": "蘑菇丛",
   "x": 100,
   "y": 177,
   "r": 12,
   "action": "gather_mushroom"
  },
  {
   "name": "去密林深处",
   "x": 360,
   "y": 110,
   "r": 16,
   "action": "goto_deep_inner"
  },
  {
   "name": "回森林边缘",
   "x": 20,
   "y": 195,
   "r": 16,
   "action": "goto_forest_edge"
  }
 ]
};
