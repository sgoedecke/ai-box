$(function () {
var socket = io();
$('form').submit(function(){
  socket.emit('chat message', { text: $('#m').val() });
  $('#m').val('');
  return false;
});

socket.on('chat message', function(msg){
  console.log("MSG", msg.text)
  $('#messages').append($('<li>').text(msg.text));
});

socket.on('clear', function(msg){
  $('#messages').empty();
  $('#releaseAI').attr("hidden", msg.isAI)
});

$('#releaseAI').click(function() {
  socket.emit('release message')
})

$('html').keydown(function(key) {
	$('#m').val($('#m').val + key)
})
});