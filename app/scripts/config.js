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
      });
      cachedEls.$play.on('click', function() {
        cachedEls.$login
          .animate(
            { left: '-2000px', opacity: 0 },
            { duration: 1200, easing: 'linear', complete: function() {
                cachedEls.$login.hide();
                cachedEls.$game.show().animate(
                  { left: '0', opacity: 1 },
                  { duration: 600, easing: 'linear', complete: function() {
                    app.startGame();
                  }}
                );
              }
            }

        );
      });
    },
    cachedEls: {
      initCache: function() {
        this.$login = $('.login');
        this.$game = $('.game');
        this.$play = $('.btn.play');
      }
    },
    // app.points[x+':'+y] = {status:.., user:2}
    points: {},
    settings: {
      boardWidth: 10,
      boardHeight: 7
    },
    helpers: {
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
      startTimer: function(){
        setInterval(function(){

        }, 60000)
      }
    },
    startGame: function(){
      this.helpers.initClouds();
      $('#myModal').reveal();
    }

  }
  app.init();
});