var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(4000, function(){
	console.log('listening on *:4000');
});

