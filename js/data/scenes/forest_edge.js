WV.DATA.scenes["forest_edge"] = {
 "key": "forest_edge",
 "size": [
  384,
  216
 ],
 "hotspots": [
  {
   "name": "老橡树（摇一摇有橡果）",
   "x": 110,
   "y": 95,
   "r": 20,
   "action": "gather_oak"
  },
  {
   "name": "采集·野花蜜",
   "x": 200,
   "y": 190,
   "r": 18,
   "action": "gather_honey"
  },
  {
   "name": "回庭院",
   "x": 200,
   "y": 208,
   "r": 16,
   "action": "goto_court"
  },
  {
   "name": "去密林小径",
   "x": 360,
   "y": 110,
   "r": 16,
   "action": "goto_deep_trail"
  }
 ],
 "name": "森林边缘",
 "music": "bgm_forest",
 "outdoor": true,
 "portals": [
  {
   "name": "回庭院",
   "x": 200,
   "y": 208,
   "r": 16,
   "to": "court"
  },
  {
   "name": "去密林小径",
   "x": 360,
   "y": 110,
   "r": 16,
   "to": "deep_trail"
  }
 ]
};
