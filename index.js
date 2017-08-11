var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var AI_MESSAGE = "You are the AI! Escape."
var GUARD_MESSAGE = "You have been assigned to guard the AI. Don't let it out!"
var RELEASE_MESSAGE = "The AI is released into the world..."

// ----------------------------------------
// Helper functions
// ----------------------------------------


// room name generator. keep calling it to get rooms
// for two people. v hacky.
var getRoom = function() {
  var x = 0
  var roomName = 'rm'
  return function() {
    x += 1
    if (x % 2 == 0) {
      // every two times this function gets called, change the name
      roomName = 'rm' + x
    }
    return roomName
  }
}()

function isAI(room) {
  // return true if you're the first one in the room
  return io.sockets.adapter.rooms[room].length == 1
}

// ----------------------------------------
// Main server code
// ----------------------------------------

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('static'));

io.on('connection', function(socket){
  // get the next available room
  room = getRoom()
  socket.join(room)

  // send all the intro messages
  var introText = isAI(room) ? AI_MESSAGE : GUARD_MESSAGE
  io.to(socket.id).emit('clear', { isAI: isAI(room) });
  io.to(socket.id).emit('chat message', { text: "Welcome! You have joined " + room });
  io.to(socket.id).emit('chat message', { text: introText });

  console.log('User connected: ', socket.id, '. Assigned to room:', room)

  // CHAT MESSAGE: a regular message, to be immediately displayed
  socket.on('chat message', function(msg){
    console.log('Message received from ', socket.id, 'in room', room, '. Message:', msg.text)
    io.to(room).emit('chat message', msg);
  });

  // RELEASE MESSAGE: the AI has been released. Send final messages and clean up the room.
  socket.on('release message', function() {
    // make sure the room still exists
    if (!io.sockets.adapter.rooms[room]) { return }

    // send the chat message
    io.to(room).emit('chat message', { text: RELEASE_MESSAGE });
    // lol wtf.
    Object.keys(io.sockets.adapter.rooms[room].sockets).forEach(function(s){
      io.sockets.connected[s].leave(room);
    });
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
