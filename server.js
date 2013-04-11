var express = require("express"),
    app     = express(),
    port    = parseInt(process.env.PORT, 10) || 3000,
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server, { log: false });
  
app.get("/", function(req, res) {
  res.redirect("/index.html");
});

app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({
    dumpExceptions: true, 
    showStack: true
  }));
  app.use(app.router);
});

//game
//store users
var users = [];
var currentUserTurn = 0;

io.sockets.on("connection", function(socket) {
  console.log('CONNECTION');
  socket.on('join', function(nick, callback) {
    console.log('smn want to connect : ' + nick)
    // If the nickname isn't in use, join the user
    if (users.indexOf(nick) < 0) {
      users.push(nick);

      socket.broadcast.emit("user-joined", nick);
      if (users.length > 1) {
        //game can be started, with first one to login to start
        console.log('GAME START: first turn - ' + users[currentUserTurn])      
        socket.broadcast.emit("turnStart", {user: users[currentUserTurn]});
      }
      callback(true, users);
    } else {
      callback(false);
    }
  });
  socket.on('passTurn', function(point){
    console.log('PASS TURN from ' + users[currentUserTurn]); 
    currentUserTurn = currentUserTurn === 0 ? 1 : 0;
    console.log('PASS TURN to ' + users[currentUserTurn]);
    socket.broadcast.emit("turnStart", {user: users[currentUserTurn], point : point});
  })
});

server.listen(port);

