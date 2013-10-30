// load the AMD modules we need
require([
  'frozen/GameCore'
], function(GameCore){
  'use strict';
  
  var needUpdate = true;
  var tileSize = 50;
  var p = {
    x: 1,
    y: 4
  };
  var p_end = {
    x: 1,
    y: 4  
  };
  var path = [];
  var radius = tileSize / 2;
  var mapTiles = [ //, q: false, unlock:[]
        {x:1, y:4},
        {x:2, y:4},
        {x:3, y:4, q: false, unlock: [{x:4, y:4}]},
        {x:4, y:3}, {x:4, y:5}, {x:4, y:6, q: false, unlock:[{x:5, y:6}]},
        {x:5, y:3},
        {x:6, y:3}, {x:6, y:6}, {x:6, y:7}, {x:6, y:8, q: false, unlock:[{x:7, y:8}, {x:6, y:9}]}, {x:6, y:10},
        {x:7, y:3, q: false, unlock:[{x:8, y:3}]}, {x:7, y:10},
        {x:8, y:0}, {x:8, y:2, q: false, unlock: [{x:8, y:1}, {x:9, y:2}]} , {x:8, y:4}, {x:8, y:5}, {x:8, y:6, q: false, unlock:[{x:9, y:6}]}, {x:8, y:8}, {x:8, y:10},
        {x:9, y:0}, {x:9, y:8}, {x:9, y:10, q: false, unlock:[{x:10, y:10}, {x:9, y:11}]}, {x:9, y:12},
        {x:10, y:0}, {x:10, y:2, q: false, unlock:[{x:10, y:3}, {x:11, y:2}]}, {x:10, y:4}, {x:10, y:6}, {x:10, y:8}, {x:10, y:12},
        {x:11, y:4, q: false, unlock:[{x:12, y:4}]}, {x:11, y:6}, {x:11, y:8}, {x:11, y:10}, {x:11, y:12},
        {x:12, y:2}, {x:12, y:6}, {x:12, y:8}, {x:12, y:10}, {x:12, y:12}
      ];
      
  function getNeighbors(tile){
    var neighbors = []
      , x = tile.x
      , y = tile.y;
    for(var i = 0; i < mapTiles.length; i++){
      var t = mapTiles[i];
      if(!(t.x === x && t.y === y) &&
          (
            (t.x === x + 1 && t.y === y) || //E
            (t.x === x - 1 && t.y === y) || //W
            (t.x === x && t.y === y + 1) || //N
            (t.x === x && t.y === y - 1)    //S
          )
      )
        neighbors.push(mapTiles[i]);
    }
    return neighbors;
  }
  
  function hasTile(tileArr, tile){
    var _hasTile = false;
    for(var i = 0; i < tileArr.length; i++){
      if(tileArr[i].x === tile.x && tileArr[i].y === tile.y){
        _hasTile = true;
        break;
      }
    }
    return _hasTile;
  }
  
  function findPathRec(current, origins, end, path){
    if(current.x === end.x && current.y === end.y){
      path.push(current);
      return true;
    }
    var neighbors = getNeighbors(current);
    for(var i = 0; i < neighbors.length; i++){
      var neighbor = neighbors[i];
      if(neighbor !== null && !hasTile(origins,neighbor)){
        var new_origins = origins.slice(0);
        new_origins.push(current);
        if(findPathRec(neighbor, new_origins, end, path)){
          path.push(current);
          return true;
        }
      }
    }
    return false;
  }

  // setup a GameCore instance
  var game = new GameCore({
    canvasId: 'canvas',
    initInput: function(im){ 
    },
    handleInput: function(im){
      if(im.mouseAction.isPressed()){
        var mpos = im.mouseAction.position;
        var mx = Math.floor(mpos.x / tileSize);
        var my = Math.floor(mpos.y / tileSize);
        if(mx !== p.x || my !== p.y){
          var onTile = false, tile = null;
          for(var i = 0; i < mapTiles.length; i++){
            if(mapTiles[i].x === mx && mapTiles[i].y === my){
              tile = mapTiles[i];
              onTile = true;
              break;
            }
          }
          if(onTile){
            if(typeof tile.q !== 'undefined' && tile.q === false){
              if (tile.unlock !== 'undefined' ){
                for(var ui = 0; ui < tile.unlock.length; ui++){
                  mapTiles.push(tile.unlock[ui]);
                }
                tile.q = true;
              }
            }
            var new_path = [];
            if(findPathRec(p, [p], {x: mx, y: my}, new_path)){
              path = new_path;
              needUpdate = true;
            }
          }
          console.log('click pos: ' + mx + ':' + my);
        }
      }
    },
    update: function(millis){
    },
    draw: function(context){
      console.log('draw');
      if(needUpdate){
        
        if(path.length > 0){
          console.log();
        }
        
        var currEnd = path[path.length-1];
        if(p_end !== currEnd && path.length > 0) p_end = currEnd;
        if(p_end !== null && path.length > 0 && p_end.x === p.x && p_end.y === p.y){
          path.splice(path.length-1,1);
          p_end = (path.length > 0) ? path[path.length-1] : null;
        }
        
        if(p_end !== null && (p.x !== p_end.x || p.y !== p_end.y)){
          var step = 0.2;
          if(p_end.x-p.x>0){
            p.x = Math.min(p_end.x, p.x+step);
          } else {
            p.x = Math.max(p_end.x, p.x-step);
          }
          if(p_end.y-p.y>0){
            p.y = Math.min(p_end.y, p.y+step);
          } else {
            p.y = Math.max(p_end.y, p.y-step);
          }
        }
        
        if(p_end === null ) needUpdate = false;
        
        context.clearRect(0, 0, this.width, this.height);
        context.lineWidth = 0;
        for(var i = 0; i < mapTiles.length; i++){
          if(typeof mapTiles[i].q === 'undefined'){
            context.fillStyle="#bbbbbb";
          } else {
            context.fillStyle=(mapTiles[i].q) ? "#59f839" : "#f83939";
          }
          context.fillRect(mapTiles[i].x*tileSize,
          mapTiles[i].y*tileSize,
          tileSize, tileSize);
        }
        
        context.fillStyle="#00bbbb";
        context.beginPath();
        context.arc(p.x*tileSize+radius,p.y*tileSize+radius,radius/2,0,2*Math.PI);
        context.stroke();
        context.fill();
      }
    }
  });

  // if you want to take a look at the game object in dev tools
  console.log(game);

  // launch the game!
  game.run();
});
