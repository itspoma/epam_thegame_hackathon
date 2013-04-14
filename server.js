var express = require('express'),
    UUID    = require('node-uuid'),
    app     = express(),
    port    = parseInt(process.env.PORT, 10) || 5009,
    http    = require('http'),
    server  = http.createServer(app),
    io      = require('socket.io').listen(server, { log: false });

process.on('exit', function(){
  console.log('EXIT');
  server.close()
});

app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/app'));
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.use(app.router);
});

//init SERVER listening
server.listen(port);
console.log('\t :: Express :: Listening on port ' + port );

// single route
app.get("/", function(req, res) {
  res.redirect("/index.html");
});

//keep clients
var users = {},
  usersID = [],
  playersCape = 2,
  playerTurn = 0,
  possibleHeroes = ['wolf', 'sheep'];
// init SOCKETS listening for connection
// add user UID to maintain list of users
io.sockets.on('connection', function(socket) {
  //generate unique id, looks like:
  //5b2ca132-64bd-4513-99da-90e838ca47d1
  //and store this on their socket/connection
  var user = {};
  user.id = UUID();
  //mock up character
  user.hero = possibleHeroes[getObjLength(users)];
  //save in db
  users[user.id] = user;
  usersQuantity = getObjLength(users);
  //we use usersID array to switch turns as a fast workaround
  usersID.push(user.id);
  //glocals for user
  var isGameReady = false;
  var allAreReady = true;
  //EMITERS
  //tell the player they are connected giving them their ID
  socket.emit('connected', user);
  console.log('\t socket.io:: client connected ' + JSON.stringify(user));

  //connection status: alone or have someone to play with?
  //console.log(JSON.stringify(users), '\n USERS quantity : ' + usersQuantity);
  if(usersQuantity > playersCape - 1) isGameReady = true;
  //send game readiness status to ALL clients
  io.sockets.emit('gameReadyStatus', isGameReady);

  //LISTENERS
  //after all rendering, animations etc
  socket.on('clientReadyForGame', function(client){
    //console.log('CLIENT IS READY FOR GAME: id - ' + client.id);
    //set ready to our user
    users[client.id].isReadyForGame = true;
    //check all users for readiness
    for (var key in users){
      //console.log('CHECK if all are ready : ' + allAreReady);
      if( ! users[key].isReadyForGame) allAreReady = false;
      //console.log('CHECK if all are ready : ' + allAreReady);
    }
    //emit to ALL that all are ready and game should start
    if(allAreReady){
      console.log('ALL ARE READY - START TURN: ' + usersID[playerTurn]);
      io.sockets.emit('startTurn', {player: {id : usersID[playerTurn], hero:possibleHeroes[playerTurn] }, enemy: {} } );
    }; //else w8 for another player to be ready
  });
  //after player clicked on dot
  socket.on('playerMadeTurn', function(data){
    console.log('\t socket.io:: previous player data : ' + JSON.stringify(data));
    io.sockets.emit('addEnemyPoint', {enemy:data, player:usersID[playerTurn], playerHero:possibleHeroes[playerTurn] });
    playerTurn = playerTurn === 0 ? 1 : 0;
    var enemyData = data || {};
    var turnDAta = {
                    player: { id : usersID[playerTurn], hero:possibleHeroes[playerTurn] },
                    enemy: enemyData
                    };
    io.sockets.emit('startTurn', turnDAta);
    console.log('TURN STARTED: player turn - ' + usersID[playerTurn]);
  });
  //When this client disconnects
  socket.on('disconnect', function () {
    //Useful to know when someone disconnects
    console.log('\t socket.io:: client disconnected ' + user.id );
    //remove him from users list
    delete users[user.id];
    console.log('\t socket.io:: remaining users are notified ' + JSON.stringify(users) );
    //reset ready flag
    isGameReady = false;
    //send to his enemy notificatio
    socket.broadcast.emit('enemyLeftGame');
  });
});

//utils
function getObjLength(obj){
  return Object.keys(obj).length;
}