var app;

$(function(){
  app = {
    init: function() {
      this.cachedEls.initCache();
      this.helpers.drawTable();
      this.bindEvents();
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
    },
    cachedEls: {
      initCache: function() {
        this.$body = $('body');
        this.$login = $('.login');
        this.$game = $('.game');
        this.$lobby = $('.lobby');
        this.$play = $('.btn.play');
      }
    },
    // app.points[x+':'+y] = {status:.., user:2}
    points: {},
    settings: {
      boardWidth: 10,
      boardHeight: 7
    },
    properties: {
      currentPage: $('section[id^="pagename-"]').filter(function () { return $(this).hasClass('active'); }),
      socket: '',
      userId: ''
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
      drawTable: function() {
        $('#container').append($('<table/>'));
        for (var x=1; x<=app.settings.boardHeight; x++) {
          $('#container table').append('<tr data-x='+x+'></tr>');
          for (var y=1; y<=app.settings.boardWidth; y++) {
            $('#container table tr:last').append('<td><span></span></td>');
          }
        }
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
      updateTimer: function(){

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
          $('#myModal').reveal();
        }
      }
    }

  }
  app.init();
});