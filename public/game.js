var game;

$(function() {
  game = app = {};
  app.$canvas = $('#game_points');
  app.in_action = false;
  app.mouse = app.players = app.data = app.size = {};

  app.size.width = 200;
  app.size.height = 200;

  app.data.playerStep = 'black';
  app.data.pointList = app.data.pointByPlayer = new Array();

  app.data.pointByPlayer['black'] = app.data.pointByPlayer['red'] = new Array();

  app.mouse.top = 0;
  app.mouse.left = 0;

  app.players.black = {
    color: '#0000ff'
  };
  app.players.red = {
    color: '#ff0000'
  };

  if (app.$canvas[0].getContext) app.ctx = app.$canvas[0].getContext('2d');
  else return false;

  app.functions = {
    setPoint: function(coordX, coordY) {

      coordX = Math.round(coordX / 20) * 20;
      coordY = Math.round(coordY / 20) * 20;

      if (app.data.pointList[coordX + '.' + coordY]) return false;

      app.ctx.beginPath();
      app.ctx.arc(coordX, coordY, 5, 0, Math.PI * 2, true);
      app.ctx.fillStyle = app.players[app.data.playerStep].color;
      app.ctx.closePath();
      app.ctx.fill();

      app.data.pointByPlayer[app.data.playerStep][coordX + '.' + coordY] = app.data.pointList[coordX + '.' + coordY] = {
        playerName: app.data.playerStep,
        coordX: coordX,
        coordY: coordY,
        quadraX: coordX / 20,
        quadraY: coordY / 20
      }

      if (app.data.playerStep == 'black') app.data.playerStep = 'red';
      else app.data.playerStep = 'black';

    },
    startTurn: function(forUser){
      app.in_action = true;
    }
  }
  app.$canvas.mousemove(function(e) {
    app.offset = app.$canvas.offset();
    app.mouse.top = parseInt(e.pageY - app.offset.top);
    app.mouse.left = parseInt(e.pageX - app.offset.left);
  });
  app.$canvas.click(function(e) {
    if (! app.in_action) return false;    
    var left = app.mouse.left
      , top = app.mouse.top;
    app.functions.setPoint(left, top);
    //EMIT
    socket.emit('passTurn', {left: left, top: top})
    app.in_action = false;
    return false;
  });
});