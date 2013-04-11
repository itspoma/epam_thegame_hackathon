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

io.sockets.on("connection", function(socket) {
  console.log('CONNECTION');
  socket.on('join', function(user, callback) {
    console.log('smn want to connect : ' + user);    
  });  
});

server.listen(port);

