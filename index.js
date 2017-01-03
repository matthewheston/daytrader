var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var fs = require('fs');
var path = require('path');
var serveIndex = require('serve-index');

keysToUrls = {};
keysToTotalPlayers = {};
keysToRound = {};
keysToSubmissions = {};

function handleSubmission(room, io) {
  console.log("3 submissions");
  keysToRound[room] += 1;
  var groupTotal = 0;
  for (i=0; i<keysToSubmissions[room].length; i++){
    groupTotal += parseInt(keysToSubmissions[room][i]["groupRate"]);
  }
  io.in(room).emit("group-total", Math.round(groupTotal/3));
  io.in(room).emit("increment-round", keysToRound[room]);
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/welcome.html');
});

app.get('/daytrader', function(req, res){
  res.sendFile(__dirname + '/daytrader.html');
});

app.get('/create', function(req, res){
  res.sendFile(__dirname + '/create_new.html');
});

app.get('/join', function(req, res){
  res.sendFile(__dirname + '/join.html');
});

app.use('/static', express.static(path.join(__dirname, 'public')))

io.on('connection', function(socket){
  socket.on("room-setup", function(data) {
    keysToUrls[data["keyword"]] = data["url"];
  });
  socket.on("get-room", function(roomName) {
    socket.emit("send-to-room", [roomName, keysToUrls[roomName]]);
  });
  socket.on("get-rooms", function(data) {
    socket.emit("room-list", keysToUrls);
  });
  socket.on("room", function(data) {
    socket.join(data);
    if (data in keysToTotalPlayers) {
      keysToTotalPlayers[data] += 1;
      if (keysToTotalPlayers[data] >= 3) {
        delete keysToUrls[data];
        socket.emit("room-full");
        io.in(data).emit("room-full");
        keysToRound[data] = 1;
        keysToSubmissions[data] = [];
      }
    } else {
      keysToTotalPlayers[data] = 1;
    }
    console.log(keysToTotalPlayers);
  });
  socket.on("submit", function(data) {
    console.log("a submission");
    keysToSubmissions[data["room"]].push(data);
    console.log(keysToSubmissions);
    if (keysToSubmissions[data["room"]].length == 3) {
      handleSubmission(data["room"], io);
      keysToSubmissions[data["room"]] = [];
    }
  });
  socket.on('chat-message', function(msg){
    io.sockets.in(msg["room"]).emit('chat-message', msg["chat"]);
  });
});

http.listen(4001, function(){
  console.log('listening on *:4001');
});
