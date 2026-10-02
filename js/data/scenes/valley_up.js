WV.DATA.scenes["valley_up"] = {
 "key": "valley_up",
 "name": "溪谷上坡",
 "music": "bgm_forest",
 "outdoor": true,
 "portals": [
  {
   "name": "回溪边",
   "x": 20,
   "y": 195,
   "r": 16,
   "to": "valley_side"
  },
  {
   "name": "去山丘花田",
   "x": 360,
   "y": 110,
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
   "name": "轻木树",
   "x": 140,
   "y": 112,
   "r": 12,
   "action": "gather_wood"
  },
  {
   "name": "云朵羊",
   "x": 260,
   "y": 50,
   "r": 9,
   "action": "spirit_sheep"
  },
  {
   "name": "回溪边",
   "x": 20,
   "y": 195,
   "r": 16,
   "action": "goto_valley_side"
  },
  {
   "name": "去山丘花田",
   "x": 360,
   "y": 110,
   "r": 16,
   "action": "goto_hill_flower"
  }
 ]
};
