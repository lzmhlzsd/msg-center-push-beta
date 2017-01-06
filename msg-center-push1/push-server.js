var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var index = 1;
var port = 4000;
var redis = require('socket.io-redis');
var socketioJwt = require('socketio-jwt');

app.get('/', function(req, res) {
    console.log('aa' + index)
    index++;
    res.sendFile(__dirname + '/index.html');
})


// io.sockets.on('connection', function(socket) {

// 	console.log(socket)
//     //socket.emit('news', { port: port });
//     // socket.on('my other event', function(data) {
//     //     console.log(data);
//     // });
//     socket.on('disconnect', function() {
//     	console.log('客户端断开连接.......')
//         io.emit('user disconnected');
//     });//
// });

io.set('authorization', function(handshakeData, callback){
	console.log(handshakeData._query.token)
	if(handshakeData._query.token == '123456'){
		callback(null, true);
	}
	else{
		callback('error', false);
	}
})

io.sockets.on('connection', function(socket) {
    console.log('客户端连接成功')
    console.log(socket.handshake.query.token);
    socket.emit('news', { port: port, handshake: socket.handshake });
    socket.on('disconnect', function() {
        console.log('客户端断开连接.......')
    });
});
io.adapter(redis({ host: 'localhost', port: 6379 }));

server.listen(port, function() {
    console.log('listening on *:' + port);
});
