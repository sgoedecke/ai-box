var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var AI_MESSAGE = "*** You are the AI! Escape. ***"
var GUARD_MESSAGE = "*** You are guarding the AI. ***"
var RELEASE_MESSAGE = "*** The AI is released into the world... ***"

// ----------------------------------------
// Helper functions
// ----------------------------------------


// room name generator. keep calling it to get rooms
// for two people. v hacky.
var getRoom = function() {
  var x = 1
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

function hasOnlyOneOccupant(room) {
  // return true if you're the first one in the room
  return io.sockets.adapter.rooms[room].length == 1
}

// ----------------------------------------
// Main server code
// ----------------------------------------

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// serve js and css 
app.use(express.static('static'));

io.on('connection', function(socket){
  // get the next available room
  var room = getRoom()
  socket.join(room)

  // first one to make it into the room is the AI
  var isAI = hasOnlyOneOccupant(room)

  // send all the intro messages
  var introText = isAI ? AI_MESSAGE : GUARD_MESSAGE
  io.to(socket.id).emit('clear', { isAI: isAI });
  io.to(socket.id).emit('chat message', { systemMessage: true, text: "Welcome! You have joined " + room });
  io.to(socket.id).emit('chat message', { systemMessage: true, text: introText });
  if (isAI) {
    io.to(socket.id).emit('chat message', { systemMessage: true, text: "Waiting for a guard to come online..."})
  } else {
    io.to(room).emit('chat message', { systemMessage: true, text: 'Connection established.'})
  }

  console.log('User connected: ', socket.id, '. Assigned to room:', room)

  // CHAT MESSAGE: a regular message, to be immediately displayed
  socket.on('chat message', function(msg){
    console.log('Message received from ', socket.id, 'in room', room, '. Message:', msg.text)
    io.to(room).emit('chat message', Object.assign(msg, { isAI: isAI }));
  });

  // RELEASE MESSAGE: the AI has been released. Send final messages and clean up the room.
  socket.on('release message', function() {
    // make sure the room still exists
    if (!io.sockets.adapter.rooms[room]) { return }

    // send the chat message
    io.to(room).emit('chat message', { text: RELEASE_MESSAGE });

    // kick everyone out of the room
    Object.keys(io.sockets.adapter.rooms[room].sockets).forEach(function(s){
      io.sockets.connected[s].leave(room);
    });
  })

  socket.on('disconnect', function() {
    io.to(room).emit('chat message', { systemMessage: true, text: 'Connection lost.' })
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
