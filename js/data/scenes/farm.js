WV.DATA.scenes["farm"] = {
 "key": "farm",
 "size": [
  384,
  216
 ],
 "hotspots": [
  {
   "name": "农田操作区",
   "x": 96,
   "y": 150,
   "r": 80,
   "action": "farm_plot"
  },
  {
   "name": "回庭院",
   "x": 12,
   "y": 190,
   "r": 14,
   "action": "goto_court"
  },
  {
   "name": "去森林边缘",
   "x": 370,
   "y": 195,
   "r": 16,
   "action": "goto_forest_edge"
  }
 ],
 "name": "庭院·田园",
 "music": "bgm_spring",
 "outdoor": true,
 "portals": [
  {
   "name": "回庭院",
   "x": 12,
   "y": 190,
   "r": 16,
   "to": "court"
  },
  {
   "name": "去森林边缘",
   "x": 370,
   "y": 195,
   "r": 16,
   "to": "forest_edge"
  }
 ]
};
