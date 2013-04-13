var app;

$(function(){
  app = {
    init: function() {
      this.helpers.drawTable();
      this.bindEvents();
    },
    bindEvents: function() {
      $('#container table td span').on('click', function(){
        var x = $(this).attr('data-x');
        var y = $(this).attr('data-y');
      });
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
      }
    }

  }
  app.init();
});