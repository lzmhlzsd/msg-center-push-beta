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

app.get('/push', function(req, res){

    var room = req.query.token;
    var data = req.query.data;
    console.log('push: ' + room);
    console.log('push: ' + data);
    io.sockets.in(room).emit('news', { port: port, handshake: data })
    res.send('ok');
})
// io.sockets.on('connection', function(socket) {

//  console.log(socket)
//     //socket.emit('news', { port: port });
//     // socket.on('my other event', function(data) {
//     //     console.log(data);
//     // });
//     socket.on('disconnect', function() {
//      console.log('客户端断开连接.......')
//         io.emit('user disconnected');
//     });//
// });

var tokens = [
    '123', '124', '125', '126'
]


io.set('authorization', function(handshakeData, callback) {
    console.log(handshakeData._query.token)
    if (handshakeData._query.token == '123456' || handshakeData._query.token == '234567') {
        callback(null, true);
        
    } else {
        callback('error', false);
    }
})

io.sockets.on('connection', function(socket) {
    console.log('客户端连接成功，issued：' + socket.handshake.issued + ', ip：' + socket.handshake.headers['x-forwarded-for'])
    console.log('加入房间号：' + socket.handshake.query.token);
    socket.join(socket.handshake.query.token);
    socket.emit('news', { port: port, handshake: socket.handshake });
    socket.on('disconnect', function() {
        console.log('客户端断开连接.......')
    });

    setTimeout(function(){
        socket.emit('news', { port: port, handshake: 123 });
    }, 5000)
});

server.listen(port, function() {
    console.log('listening on *:' + port);
});
