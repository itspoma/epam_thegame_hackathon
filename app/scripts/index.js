var app;

$(function(){
  app = {
    init: function() {
      this.cachedEls.initCache();
      this.helpers.drawTable();
      this.bindEvents();
      app.pages.login.initPage();

      // rand hero's animation
      setInterval(function(){
         $els = app.helpers.rand(1,2) == 1 ? $('table .wolf:not(.hover)') : $('table .sheep:not(.hover)');
         $el = $els.eq(app.helpers.rand(0,$els.length-1));
         (function(){
            $el.addClass('hover');
            setTimeout(function(){$el.removeClass('hover')},100);
         })($el);
      }, 300);
    },

    initDummy: function() {
      app.users = {
          1: {id:1, name:'user1', hero:'wolf'},
          2: {id:2, name:'user2', hero:'sheep'}
      };
      app.userTurn = 1;
    },

    bindEvents: function() {
      $('.sound').bind('click', function(){
        if($(this).hasClass('disabled')){
          $(this).removeClass('disabled');
          Howler.unmute();
        } else {
          $(this).addClass('disabled');
          Howler.mute();
        }
      });

      var cachedEls = this.cachedEls;
      //Launch connection process
      cachedEls.$play.on('click', function() { cachedEls.$body.trigger('connect'); });
      //Connect two players through lobby
      cachedEls.$body.on('connect', function() {
        console.log('connect!');

        app.properties.socket = io.connect('http://'+location.host+'/');
        console.log(app.properties.socket);

        app.properties.socket.on('connected', function(client) {
          app.properties.userId = client.id;
          app.properties.hero = client.hero;
          console.log(client.id + ' is connected');

          // console.log($('.player.'+app.properties.hero));
          // console.log($('.player:not(.active)'));
          $('.player.'+app.properties.hero).find('h5').after('<div class="hand '+(app.properties.hero=='wolf'?'hand_right':'hand_left')+'"></div>');
          // $('.player:not(.active)').find('h5').after('<div class="hand hand_disabled"></div>');
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

        app.properties.socket.on('addEnemyPoint', function(data){

          app.properties.currentHero = data.playerHero;

          // if it's me - then ignore
          if (data.player == app.properties.userId) {
            return;
          }

          console.log(app.properties.userId);
          console.log('addEnemyPoint', data);

          $td = $('table td').filter(function() {
            return $(this).data('x') === data.enemy.point.x && $(this).data('y') === data.enemy.point.y;
          });
          $('span',$td).addClass(data.enemy.hero);

          app.helpers.addPoint(data.enemy.point.x, data.enemy.point.y, data.player);

          app.helpers.calculatePolygon(data.enemy.point.x, data.enemy.point.y, data.player, function(){
              app.properties.currentUser = data.player;

              var $scoreEl = $('.player.'+app.properties.currentHero+' .score');
              $scoreEl.text(parseInt($scoreEl.text()) + 1);

              if ($scoreEl.text() >= app.settings.winnerLimit ) {
                app.messages.showGameLoserMessage();
                return;
              }

              app.messages.showRoundLoserMessage(function(){
                app.messages.hideMessage();
                app.reset_game();
              });
              app.sounds.playFailSound();

          });
        });

        app.properties.socket.on('startTurn', function(gameData) {
          //app.properties.userId - ME
          //app.properties.currentGameData.player.id - ENEMY

          console.log('ME', app.properties.userId);
          app.properties.currentGameData = gameData;
          app.properties.currentUser = gameData.player.id;

          $('.player.active').removeClass('active');
          $('.player.'+gameData.player.hero).addClass('active');

        });
        app.properties.socket.on('enemyLeftGame', function() {
          app.messages.showErrorEnemyDisconected();
        });
      });
      //APPLY click handlers
      $('table td', cachedEls.$container).on('click', app.binders.onPointClick);
    },

    reset_game: function() {
      $('span.wolf, span.sheep').attr('class','');
      $('span.captured').removeClass('captured');
      $('td span').css({'opacity':1});
      app.points = [];
    },
    inc_score: function() {
      //
    },

    binders: {
      onPointClick: function(){

        console.log(app.properties.currentGameData, 'currentGameData');
        if (app.properties.userId !== app.properties.currentUser) {
          console.log('Its not your turn');
          return false;
        }

        var $td = $(this);
        var x = $td.data('x');
        var y = $td.data('y');

        console.log(x);
        console.log(y);

        var pointData = app.helpers.getPointData(x,y);
        console.log(pointData);
        if (pointData !== null) {
            //alert(pointData.user);
            return;
        }

        var userData = app.helpers.getUserData(app.properties.userId);

        app.properties.currentHero = app.properties.hero;

        $('span',$td).addClass(app.properties.hero);
        app.helpers.addPoint(x, y, app.properties.userId);
        // console.log(app.properties.currentGameData.enemy.id);

        app.helpers.calculatePolygon(x, y, app.properties.userId, function(){
          app.properties.currentUser = app.properties.userId;
          app.sounds.playWinnerSound();

          var $scoreEl = $('.player.'+app.properties.currentHero+' .score');
          $scoreEl.text(parseInt($scoreEl.text()) + 1);

          if ($scoreEl.text() >= app.settings.winnerLimit ) {
            app.messages.showGameWinnerMessage();
            return;
          }
          app.messages.showRoundWinnerMessage(function(){
            app.messages.hideMessage();
            app.reset_game();
          });


        });

        app.helpers.makeTurn(x,y);
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
      boardHeight: 7,
      winnerLimit: 2
    },

    properties: {
      currentPage: $('section[id^="pagename-"]').filter(function () { return $(this).hasClass('active'); }),
      currentGameData: null,
      currentUser: null,
      socket: '',
      userId: '',
      hero: ''
    },

    messages: {
      showWaitingPlayerMessage: function(){
        this.showMessage(
          '<p style="margin-top: 55px">Waiting for another player...</p>'+
          '<p><img src="../img/loader2.gif"></p>'
        );
      },

      showRoundWinnerMessage: function(cb){
        this.showMessage(
          '<h1>Woohoo!</h1>'+
          '<p>You won the round!</p>'+
          '<p><input class="game-reset" type="image" src="../img/continue.png"></p>'
        );
        $('.reveal-modal input').one('click', cb);
      },

      showGameWinnerMessage: function(){
        this.showMessage(
          '<h1>Woohoo!</h1>'+
            '<p>You won the GAME!</p>'
        );
      },

      showRoundLoserMessage: function(cb){
        this.showMessage(
          '<br><h1>Damn!</h1>'+
            '<p>Let\'s try new round!</p>'+
            '<p><input class="game-reset" type="image" src="../img/continue.png"></p>'
        );
        $('.reveal-modal input').one('click', cb);
      },

      showGameLoserMessage: function(){
        this.showMessage(
          '<br><h1>Damn!</h1>'+
            '<p>You lose.</p>'
        );
      },

      showErrorConnectionMessage: function(){
        this.showMessage(
          '<h1>Damn!</h1>'+
            '<p>Error connection!</p>'
        );
      },

      showErrorEnemyDisconected: function(){
        this.showMessage(
          '<h1><br></h1>'+
          '<p>Sorry, enemy left the game!</p>'
        );
      },

      showMessage: function(html){
        $('.reveal-modal').html(html);
        $('.reveal-modal').show();
        $('.reveal-modal').reveal();
      },

      hideMessage: function(){
        $('.reveal-modal').empty();
        $('.reveal-modal').hide();
        $('.reveal-modal-bg').hide();
      }
    },

    sounds: {
      playGameSound: function(){
        this.playSound({urls:['../sounds/sound2.ogg', '../sounds/sound2.mp3'], loop: true, volume: 0.7});
      },

      playWinnerSound: function(){
        this.playSound({urls:['../sounds/horn.ogg', '../sounds/horn.mp3'], volume: 1.0});
      },

      playFailSound: function(){
        this.playSound({urls:['../sounds/fail.ogg', '../sounds/fail.mp3'], volume: 1.0});
      },

      playPlayer1PolygonSound: function(){
        this.playSound({urls:['../sounds/sheep.ogg', '../sounds/sheep.mp3'], volume: 1.0});
      },

      playPlayer2PolygonSound: function(){
        this.playSound({urls:['../sounds/wolf.ogg', '../sounds/wolf.mp3'], volume: 1.0});
      },

      playSound: function(params){
        var sound = new Howl({
          urls: params.urls,
          loop: params.loop || false,
          volume: params.volume
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
        var data = { point: {x : xIndex, y : yIndex}, hero: app.properties.hero };
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

      updateTimer: function() {},

      rand: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },

      drawTable: function() {
        var $container = $('#container');//app.cachedEls.$container;
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
        if (typeof(data) === 'undefined') { return null; }

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
      calculatePolygon: function(x,y,uid,onCaptured, params) {
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

                            console.log('ENEMIES IN BOX', enemiesInsidePoints.length);


                             for (var i=0; i<=params.pointsPath.length-1; i++) {
                                 var _point = params.pointsPath[i];

                                 var _pointData = app.helpers.getPointData(_point.x, _point.y);

                                 _pointData.$td.addClass('filled_now filled_now_'+i);
                                 $('span',_pointData.$td).addClass('filled');
                             }

                             // els = $('.filled_now');
                             // for (var i=0; i<=els.length-1; i++) {
                             //     var _el = $('.filled_now_'+i);
                             //     var _nextEl = $('.filled_now_'+(i+1)).length>0 ? $('.filled_now_'+(i+1)) : $('.filled_now_0');

                             //     var ax = _el.position().left+238;
                             //     var ay = _el.position().top+68;
                             //     var bx = _nextEl.position().left+238;
                             //     var by = _nextEl.position().top+68;

                             //     linedraw(ax,ay, bx,by);
                             // };

                             // $('.connect_line:not(.processed)').hide();
                             // $('.connect_line:not(.processed)').each(function(){
                             //   $(this).addClass('processed').slideToggle('slow');
                             // });

                             // $('.connect_line').slideToggle('slow')

                             // $('.filled_now').each(function(){
                             //   $(this).attr('class',  $(this).attr('class').replace(/filled_now_\d+/,'')   );
                             // });



                            // mark captured enemies
                            for (var i = 0, enemiesInsidePoint; enemiesInsidePoint = enemiesInsidePoints[i]; i++) {
                                var pointData = app.helpers.getPointData(enemiesInsidePoint.x, enemiesInsidePoint.y);
                                app.points[pointData.x+':'+pointData.y].captured = true;

                                var $span = $('span', pointData.$td);

                                (function(el) {
                                  $span.animate({opacity:0.4},400,function(){
                                    $span.addClass('captured');
                                  });
                                })($span);
                            }

                            //
                            if (app.properties.currentHero == 'wolf') {
                              app.sounds.playPlayer2PolygonSound();
                            }
                            else {
                              app.sounds.playPlayer1PolygonSound();
                            }

                            onCaptured();

                            return;
                        }
                    }
                }
                else {
                    if ($.inArray(point.x+':'+point.y, params.excludes) === -1)
                    {
                        var path = params.pointsPath;
                            path.push(point);

                        //weight += 1 +
                        arguments.callee(point.x, point.y, uid, onCaptured, {
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
        initPage: function() {
          app.sounds.playGameSound();
        }
      },
      lobby: {
        initPage: function() {
          app.helpers.switchPageTo(app.cachedEls.$lobby);
          app.messages.showWaitingPlayerMessage();
        }
      },
      game: {
        initPage: function() {
          app.messages.hideMessage();
          app.helpers.switchPageTo(app.cachedEls.$game);
          // app.helpers.initClouds();
        }
      }
    }

  }
  app.init();
});





function linedraw(ax,ay,bx,by)
{
    var _id = "line_"+ax+"_"+ay+"_"+bx+"_"+by;
    if(ay>by)
    {
        bx=ax+bx;
        ax=bx-ax;
        bx=bx-ax;
        by=ay+by;
        ay=by-ay;
        by=by-ay;
    }
    var calc=Math.atan((ay-by)/(bx-ax));
    calc=calc*180/Math.PI;
    var length=Math.sqrt((ax-bx)*(ax-bx)+(ay-by)*(ay-by));

    if (ax == bx) {
      calc = 0;
      ay += 50;
    }
    if (ay == by) {
        if (ax<bx) {
          calc = 270;
        }
        else {
          calc = 90;
        }
    }

    // var userData = app.helpers.getUserData(app.userTurn);

    document.body.innerHTML += "<div class='connect_line type_"+app.properties.currentHero+"' id='"+_id+"' style='height:" + length + "px;width:8px;position:absolute;top:" + (ay) + "px;left:" + (ax) + "px;-webkit-transform:rotate("+calc+"deg);-webkit-transform-origin:0% 0%;'></div>";
}
