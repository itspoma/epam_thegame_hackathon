var socket, nick;
$(document).ready(function() {
  socket = io.connect('http://localhost');
  var timerTime = 15000
    , nick
    , score = 0
    , scoreField;

  $("#join-form").submit(function(ev) {
    ev.preventDefault();
    // Check that a nickname has been entered
    nick = $("#nick-input").val();
    if (nick) {
      // Send a request to join game
      socket.emit("join", nick, function(successful, users) {
        if (successful) {
          $("#join-form").hide();

          //check if u are a forever alone player
          if (users.length < 2) {
            $('.gameMessages').text('Plz w8 for smn to join');
          } else {
            // init game
            initGame(users[0]);
          }

          //only possible if your only opponent so...
          socket.on("user-joined", function(user) {
            //copypast
            initGame(user);
          });

          socket.on("turnStart", function(data) {
            console.log('turn start');
            if (nick === data.user) {
              if(data.point){
                game.functions.setPoint(data.point.left, data.point.top)
              }
              game.functions.startTurn(nick);                     
            }
          });
          // If the request to join was rejected, show an error message
        } else {
          $("#nick-error").show();
        }
      });
    }

    function initGame(enemy) {
      $('#game_points').show();
      $('.gameMessages').html('<b id="user0">'+nick+'</b> VS <b id="user1">'+enemy+'</b>');
    }
  });  
});