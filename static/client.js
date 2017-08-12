$(function () {
	var socket = io();

	function submitText(){
	  socket.emit('chat message', { text: $('#m').text() });
	  $('#m').text('');
	};

	socket.on('chat message', function(msg){
		var prefix = msg.isAI ? "AI: ": "Guard: "
		if (msg.systemMessage) { prefix = '~ ' }
	  $('#messages').append($('<li>').text(prefix + msg.text));
	});

	socket.on('clear', function(msg){
	  $('#messages').empty();
	  $('#releaseAI').css("display", msg.isAI ? 'none' : 'flex')
	});

	$('#releaseAI').click(function() {
	  socket.emit('release message')
	})

	$('html').keydown(function(e) {
		if (e.key == "Backspace") {
			// slice off the last char
			$('#m').text($('#m').text().slice(0, $('#m').text().length - 1))
		}

		if (e.key == "Enter") {
			// submit!
			submitText()
		}
		// ignore non-letter chars, except for spaces
		if (!e.key.match(/^[a-zA-Z\d\-_.?!,\s]$/)) { return }
		$('#m').text($('#m').text() + e.key)
	})
});