require([
  'frozen/GameCore'
], function(GameCore){
  'use strict';
  
  var needUpdate = true // only render when needed
    , awaitMousePosition = false; // waiting for player to release mouse button
  var tileSize = 40; // size of tiles
  var p = { // current player position
    x: 1,
    y: 4
  };
  var p_end = { // current end of animation sub-path
    x: 1,
    y: 4  
  };
  var path = []; // path for player animation
  var radius = tileSize / 2;

  /**
  * Map data
  **/
  var mapTiles = [
        {x:1, y:4},
        {x:2, y:4},
        {x:3, y:4, q: false, unlock: [{x:4, y:3}, {x:4, y:4}, {x:4, y:5}, {x:5, y:3}
                                    , {x:6, y:3}, {x:4, y:6}, {x:7, y:3}], locked: false},
        {x:4, y:3, locked: true}, {x:4, y:4, locked: true}, {x:4, y:5, locked: true}
          , {x:4, y:6, q: false, unlock:[{x:5, y:6}, {x:6, y:6}, {x:6, y:7}, {x:6, y:8}], locked: true},
        {x:5, y:3, locked: true}, {x:5, y:6, locked: true},
        {x:6, y:3, locked: true}, {x:6, y:6, locked: true}, {x:6, y:7, locked: true}
          , {x:6, y:8, q: false, unlock:[{x:7, y:8}, {x:8, y:8}, {x:6, y:9}, {x:6, y:9}
                                       , {x:6, y:10}, {x:7, y:10}, {x:8, y:10}, {x:9, y:8}
                                       , {x:9, y:10}], locked: true}
          , {x:6, y:9, locked: true}, {x:6, y:10, locked: true},
        {x:7, y:3, q: false, unlock:[{x:8, y:3}, {x:8, y:4}, {x:8, y:5}, {x:8, y:2}
                                   , {x:8, y:6}], locked: true}
          , {x:7, y:8, locked: true}, {x:7, y:10, locked: true},
        {x:8, y:0, locked: true}, {x:8, y:1, locked: true}
          , {x:8, y:2, q: false, unlock: [{x:8, y:1}, {x:9, y:2}, {x:8, y:0}, {x:9, y:0}
            , {x:10, y:0}, {x:11, y:0}, {x:10, y:2}], locked: true}
          , {x:8, y:3, locked: true}, {x:8, y:4, locked: true}, {x:8, y:5, locked: true}
          , {x:8, y:6, q: false, unlock:[{x:9, y:6}, {x:10, y:6}, {x:11, y:6}, {x:12, y:6}], locked: true}
          , {x:8, y:8, locked: true}, {x:8, y:10, locked: true},
        {x:9, y:0, locked: true}, {x:9, y:2, locked: true}, {x:9, y:6, locked: true}
          , {x:9, y:8, q: false, unlock:[{x:10, y:8}, {x:11, y:8}, {x:12, y:8}], locked: true}
          , {x:9, y:10, q: false, unlock:[{x:10, y:10}, {x:11, y:10}, {x:12, y:10}, {x:9, y:11}
                                        , {x:9, y:12}, {x:10, y:12}, {x:11, y:12}, {x:12, y:12}], locked: true}
          , {x:9, y:11, locked: true}, {x:9, y:12, locked: true},
        {x:10, y:0, locked: true}
          , {x:10, y:2, q: false, unlock:[{x:10, y:3}, {x:10, y:4}, {x:11, y:2}, {x:12, y:2}
                                        , {x:11, y:4}], locked: true}
          , {x:10, y:3, locked: true}, {x:10, y:4, locked: true}, {x:10, y:6, locked: true}
          , {x:10, y:8, locked: true}, {x:10, y:10, locked: true}, {x:10, y:12, locked: true},
        {x:11, y:0, q: false, unlock:[{x:12, y:0}], locked: true}
          , {x:11, y:2, locked: true}
          , {x:11, y:4, q: false, unlock:[{x:12, y:4}], locked: true}
          , {x:11, y:6, locked: true}, {x:11, y:8, locked: true}, {x:11, y:10, locked: true}
          , {x:11, y:12, locked: true},
        {x:12, y:0, locked: true}, {x:12, y:2, locked: true}, {x:12, y:4, locked: true}
          , {x:12, y:6, locked: true}, {x:12, y:8, locked: true}, {x:12, y:10, locked: true}
          , {x:12, y:12, locked: true}
      ];

  /**
  * Get Neighbors helper
  **/
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
  
  /**
  * Has tile helper
  **/
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
  
  /**
  * Unlock helper
  **/
  function unlock(tileArr, tile){
    for(var i = 0; i < tileArr.length; i++){
      if(tileArr[i].x === tile.x && tileArr[i].y === tile.y){
        tileArr[i].locked = false;
        break;
      }
    }
  }
  
  /**
  * Path finding
  **/
  function findPathRec(current, origins, end, path){
    // did we reach the end?
    if(current.x === end.x && current.y === end.y){
      path.push(current);
      return true;
    }
    // look for the end
    var neighbors = getNeighbors(current);
    for(var i = 0; i < neighbors.length; i++){
      var neighbor = neighbors[i];
      if(neighbor !== null && !hasTile(origins,neighbor)
          && (typeof neighbor.locked === 'undefined' || neighbor.locked === false)){
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
      /**
      * Handle mouse input
      **/
      if(im.mouseAction.isPressed()){
        awaitMousePosition = true;
      }
      if(awaitMousePosition && im.mouseAction.state === 0){
        // start doing things after mouse button was released
        var mpos = im.mouseAction.position;
        // map mouse position to tiles
        var mx = Math.floor(mpos.x / tileSize);
        var my = Math.floor(mpos.y / tileSize);
        if(mx !== p.x || my !== p.y){ // mouse position different from player position?
          var onTile = false, tile = null;
          for(var i = 0; i < mapTiles.length; i++){
            if(mapTiles[i].x === mx && mapTiles[i].y === my){
              tile = mapTiles[i];
              onTile = true;
              break;
            }
          }
          // if need position is on a unlocked tile, see if there's a path to it
          if(onTile && (typeof tile.locked === 'undefined' || tile.locked === false)){
            var new_path = [];
            if(findPathRec(p, [p], {x: mx, y: my}, new_path)){
              // update only if there is a path
              if(typeof tile.q !== 'undefined' && tile.q === false){
                // handle question tile
                if (tile.unlock !== 'undefined' ){
                  for(var ui = 0; ui < tile.unlock.length; ui++){
                    unlock(mapTiles, tile.unlock[ui]);
                  }
                  tile.q = true;
                }
              }
              path = new_path;
              needUpdate = true;
            } else {
              console.log('no path to this tile, entry locked?');
            }
          }
        }
        awaitMousePosition = false;
      }
    },

    update: function(millis){
    },

    draw: function(context){
      if(needUpdate){
        /**
        * Calculate player animation
        **/
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
        if(p_end === null ) needUpdate = false; // no more updates if reached end of path
        
        /**
        * Draw all the things!
        **/
        // reset canvas
        context.clearRect(0, 0, this.width, this.height);
        // tiles
        context.lineWidth = 0;
        for(var i = 0; i < mapTiles.length; i++){
          if(typeof mapTiles[i].q === 'undefined'){
            context.fillStyle = (typeof mapTiles[i].locked === 'undefined' || mapTiles[i].locked === false)
              ? "#888888" // not locked
              : "#cfcfcf"; // locked
          } else {
            if(mapTiles[i].q){
              context.fillStyle = "#59f839";
            } else {
              context.fillStyle = (mapTiles[i].locked) ? "#D17777" : "#f83939";
            }
          }
          context.fillRect(mapTiles[i].x*tileSize,
          mapTiles[i].y*tileSize,
          tileSize, tileSize);
        }
        // player
        context.fillStyle="#00bbbb";
        context.beginPath();
        context.arc(p.x*tileSize+radius,p.y*tileSize+radius,radius*0.6,0,2*Math.PI);
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
