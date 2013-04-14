var app;

$(function(){
  app = {
    init: function() {
      this.cachedEls.initCache();
      this.helpers.drawTable();
      this.bindEvents();
      app.initDummy();
    },

    initDummy: function() {
      app.users = {
          1: {id:1, name:'user1', hero:'wolf'},
          2: {id:2, name:'user2', hero:'sheep'}
      };
      app.userTurn = 1;
    },

    bindEvents: function() {
      var cachedEls = this.cachedEls;
      $('#container table td span').on('click', function(){
        var x = $(this).attr('data-x');
        var y = $(this).attr('data-y');
        app.helpers.makeTurn(x, y);
      });
      //Launch connection process
      cachedEls.$play.on('click', function() { cachedEls.$body.trigger('connect'); });
      //Connect two players through lobby
      cachedEls.$body.on('connect', function() {
        console.log('connect!');

        app.properties.socket = io.connect('http://localhost/');
        console.log(app.properties.socket);

        app.properties.socket.on('connected', function(client) {
          app.properties.userId = client.id;
          console.log(client.id + ' is connected');
        });
        app.properties.socket.on('gameReadyStatus', function(gameIsReady) {
          if (gameIsReady) {
            console.log('START GAME');
            app.pages.game.initPage();
            app.properties.socket.emit('clientReadyForGame', { id: app.properties.userId });
          } else { 
            console.log('WAIT for RIVAL');
            app.pages.lobby.initPage();
          }
        });
        app.properties.socket.on('startTurn', function(gameData){
          var playerTurnID = gameData.player.id;
          console.log('TURN STARTED: player turn - ' + playerTurnID);
          if(app.properties.userId === playerTurnID) {
            setTimeout( function() { app.helpers.makeTurn(); }, 5000);
          }
        });
      });
      $('table td', cachedEls.$container).on('click', app.binders.onPointClick);
    },

    binders: {
      onPointClick: function(){
        var $td = $(this);

        var x = $td.data('x');
        var y = $td.data('y');

        var pointData = app.helpers.getPointData(x,y);
        if (pointData !== null) {
            alert(pointData.user);
            return;
        }

        var userData = app.helpers.getUserData(app.userTurn);

        $('span',$td).addClass(userData.hero);
        app.helpers.addPoint(x, y, userData.id);

        app.helpers.calculatePolygon(x, y, userData.id);

        if (app.userTurn == 1) {
          app.userTurn = 2;
        }
        else {
          app.userTurn = 1;
        }
      }
    },

    cachedEls: {
      initCache: function() {
        this.$body = $('body');
        this.$login = $('.login');
        this.$game = $('.game');
        this.$lobby = $('.lobby');
        this.$play = $('.btn.play');
        this.$container = $('#container');
      }
    },
    // app.points[x+':'+y] = {status:.., user:2}
    points: {},
    users: {},
    userTurn: null,
    settings: {
      boardWidth: 10,
      boardHeight: 7
    },

    properties: {
      currentPage: $('section[id^="pagename-"]').filter(function () { return $(this).hasClass('active'); }),
      socket: '',
      userId: ''
    },

    messages: {
      showWaitingPlayerMessage: function(){
        this.showPopup();
      },

      showWinnerMessage: function(){
        this.showPopup();
      },

      showLoserMessage: function(){
        this.showPopup();
      },

      showErrorConnection: function(){
        this.showPopup();
      },

      showPopup: function(){
        $('#myModal').reveal();
      }
    },

    sounds: {
      playLoginSound: function(){
        this.playSound();
      },

      playGameSound: function(){
        this.playSound();
      },

      playWinnerSound: function(){
        this.playSound();
      },

      playPlayer1PolygonSound: function(){
        this.playSound();
      },

      playPlayer2PolygonSound: function(){
        this.playSound();
      },

      playSound: function(){
        var sound = new Howl({
          urls: ['../sounds/sheep.wav', '../sounds/sheep.wav', '../sounds/sheep.wav'],
          volume: 0.5
        }).play();
      }
    },

    helpers: {
      switchPageTo: function(selector) {
        var nextPage = selector;
        var currentPage = app.properties.currentPage;
        currentPage.animate(
            { left: '-2000px', opacity: 0 },
            { duration: 1200, easing: 'linear', complete: function() {
                currentPage.removeClass('active').hide();
                selector.show().animate(
                  { left: '0', opacity: 1 },
                  { duration: 600, easing: 'linear', complete: function() {
                      selector.addClass('active'); app.properties.currentPage = selector; }
                  }
                );
              }
            }
        );
      },

      makeTurn: function(xIndex, yIndex) {
        var data = { x : xIndex, y : yIndex };
        app.properties.socket.emit('playerMadeTurn', data);
        console.log('TURN ENDED');
      },

      initClouds: function(){
        var div = $('<div>').html(
            '<div class="cloud x1"></div>'+
            '<div class="cloud x2"></div>'+
            '<div class="cloud x3"></div>'+
            '<div class="cloud x4"></div>'+
            '<div class="cloud x5"></div>').attr('id', "clouds");

        $('.wrapper').before(div);
      },

      updateScore: function(player1Score, player2Score){
        var p1Score = $("#player1Info .score");
        var p2Score = $("#player2Info .score");
        p1Score.text(parseInt(p1Score.text()) + parseInt(player2Score));
        p2Score.text(parseInt(p2Score.text()) + parseInt(player1Score));
      },

      updateTimer: function() {},

      rand: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },

      drawTable: function() {
        var $container = app.cachedEls.$container;
        $container.append($('<table/>'));

        // append <tr></tr>
        for (var x=1; x<=app.settings.boardHeight; x++) {
          $('table', $container).append('<tr></tr>');

          // append <td></td>
          for (var y=1; y<=app.settings.boardWidth; y++) {
            $('table tr:last', $container).append(
                $('<td/>')
                  .data('x', x)
                  .data('y', y)
                  .html('<span></span>')
            );
          }
        }
      },

      getUserData: function(uid) {
        return app.users[uid];
      },

      getPointData: function(x,y) {
        var data = app.points[x+':'+y];
        if (typeof(data) === 'undefined') {
            return null;
        }

        data.$td = $('td', $('tr').eq(x-1)).eq(y-1);

        return data;
      },

      addPoint: function (x,y,uid) {
        app.points[x+':'+y] = {
            'uid': uid,
            'x': parseInt(x, 10),
            'y': parseInt(y, 10),
            'captured': false
        };
      },

      // get count points around required point
      // @param x,y
      getClosestPoints:function(x,y,uid) {
          // 8 rounded
          var pointOffsets = [
              [-1,-1],[0,-1],[+1,-1],
              [-1,0],/*[0,0],*/[+1,0],
              [-1,+1],[0,+1],[+1,+1]
          ];

          var result = [];

          for (var i = 0, pointOffset; pointOffset = pointOffsets[i]; i++) {
              var xPos = x + pointOffset[0];
              var yPos = y + pointOffset[1];

              var pointData = app.helpers.getPointData(xPos, yPos);

              if (pointData && pointData.uid===uid && pointData.captured!==true) {
                  result.push(pointData);
              }
          }

          return result;
      },

      // get points count in polygon
      // @param {points} [[x,y],[x,y],[x,y],..]
      getEnemiesInBox: function(points, uid) {

        // check if point are inside in polygon
        var isPointInPoly = function(poly, pt){
          for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
            ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
            && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
            && (c = !c);
          return c;
        };

        //
        var enemyPoints = [];

        // calc total points inside
        // for (var i = 0, point; point = app.points[i]; i++) {
        for (var i in app.points) {
            var point = app.points[i];

            // we need only enemies points
            if (point.uid == uid) {
                continue;
            }

            var isPointInPolygonBorder = false;
            for (var i = 0, pointBorder; pointBorder = points[i]; i++) {
                if (point.x==pointBorder[0] && point.y==pointBorder[1]) {
                    isPointInPolygonBorder = true;
                    break;
                }
            }

            if (!isPointInPolygonBorder) {
                if (isPointInPoly(points, {x:point.x, y:point.y})) {
                    enemyPoints.push(point);
                }
            }
        };

        return enemyPoints;
      },

      //
      calculatePolygon: function(x,y,uid, params) {
        params = params || {
          depth: 0,
          excludes: [],
          startPoint: {'x':x, 'y':y},
          pointsPath: []
        };
        var __pre = x+':'+y+(new Array(params.deeph).join(' ')) + ' > ';

        var points = app.helpers.getClosestPoints(x,y,uid);

        if (points.length > 0) {
            params.excludes.push(x+':'+y);

            for (var i = 0, point; point = points[i]; i++)
            {
                if (point.x == params.startPoint.x && point.y == params.startPoint.y) {
                    if (params.depth >= 3) {

                        params.pointsPath.push(point);

                        var enemiesInsidePoints = app.helpers.getEnemiesInBox(params.pointsPath, uid);
                        console.log('ENEMIES IN BOX', enemiesInsidePoints.length);

                        if (enemiesInsidePoints.length >= 1)
                        {
                            console.log(__pre+'WO-HO-HO !!!!!!!!!!!!!!!!!!!!', x,y,point,params);

                            params.pointsPath.push(params.startPoint);

                            console.log('ENEMIES IN BOX', enemiesInsidePoints.length);

                            // mark captured enemies
                            for (var i = 0, enemiesInsidePoint; enemiesInsidePoint = enemiesInsidePoints[i]; i++) {
                                var pointData = app.helpers.getPointData(enemiesInsidePoint.x, enemiesInsidePoint.y);
                                app.points[pointData.x+':'+pointData.y].captured = true;
                                var $span = $('span', pointData.$td);

                                (function($span) {
                                  $span.css({'position':'absolute', 'margin-top':'-40px','z-index':999})
                                  $span.animate({zoom:app.helpers.rand(2,3),'margin-left':-40},'slow', function(){
                                    $span.animate({zoom:1,'margin-left':0},'fast');

                                    $span.animate({opacity:0.3},'slow',function(){
                                      $span.addClass('captured');
                                    });
                                  });
                                })($span);
                            }

                            for (var i=0; i<=params.pointsPath.length-1; i++) {
                                var _point = params.pointsPath[i];

                                var $td = $('td', $('tr').eq(_point.x-1)).eq(_point.y-1);
                                $('span',$td).addClass('filled');

                                if ($('i.connected',$td).length==0) {
                                  $td.prepend($('<i/>').attr('class','connected'));
                                }
                                $i = $('i.connected',$td);

                                (function($i){
                                  $i.hide();
                                  setTimeout(function(){
                                    $i.fadeIn('slow');//slideDown
                                  },50);
                                })($i);

                                var _nextPoint = params.pointsPath[i+1];
                                if (typeof(_nextPoint)=='undefined') {
                                  _nextPoint = params.pointsPath[0];
                                }

                                if (_nextPoint.x==_point.x && _nextPoint.y<_point.y) {
                                  $i.addClass('connect_left');
                                }

                                else if (_nextPoint.x==_point.x && _nextPoint.y>_point.y) {
                                  $i.addClass('connect_right');
                                }

                                else if (_nextPoint.x>_point.x && _nextPoint.y<_point.y) {
                                  $i.addClass('connect_bottomleft');
                                }

                                else if (_nextPoint.x>_point.x && _nextPoint.y>_point.y) {
                                  $i.addClass('connect_bottomright');
                                }

                                else if (_nextPoint.x<_point.x && _nextPoint.y>_point.y) {
                                  $i.addClass('connect_topright');
                                }

                                else if (_nextPoint.x<_point.x && _nextPoint.y<_point.y) {
                                  $i.addClass('connect_topleft');
                                }

                                else if (_nextPoint.x<_point.x && _nextPoint.y==_point.y) {
                                  $i.addClass('connect_bottom');
                                }

                                else if (_nextPoint.x>_point.x && _nextPoint.y==_point.y) {
                                  $i.addClass('connect_bottom');
                                }

                                // else if (_nextPoint.x==_point.x && _nextPoint.y==_point.y) {
                                //   $i.addClass('connect_temp');//!!
                                // }

                                else {
                                  console.log($td);
                                  console.log('_point',_point.x,_point.y);
                                  console.log('_nextPoint',_nextPoint.x,_nextPoint.y);
                                }

                                console.log($td, $i.attr('class'));
                                console.log('');
                            }

                            return;
                        }
                    }
                }
                else {
                    // console.log(__pre+'FIND ',point.x+':'+point.y);

                    if ($.inArray(point.x+':'+point.y, params.excludes) === -1)
                    {
                        var path = params.pointsPath;
                            path.push(point);

                        //weight += 1 +
                        arguments.callee(point.x, point.y, uid, {
                            depth: params.depth+1,
                            excludes: params.excludes,
                            startPoint: params.startPoint,
                            pointsPath: path
                        });
                    }
                }
            }
        }
      }
    },

    pages: {
      login: {
        initPage: function() {}
      },
      lobby: {
        initPage: function() {
          app.helpers.switchPageTo(app.cachedEls.$lobby);
        }
      },
      game: {
        initPage: function() {
          app.helpers.switchPageTo(app.cachedEls.$game);
          app.helpers.initClouds();
//          $('#myModal').reveal();
        }
      }
    }

  }
  app.init();
});