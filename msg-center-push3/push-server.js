var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var index = 1;
var port = 4002;

app.get('/', function(req, res) {
    console.log('aa' + index)
    index++;
    res.sendFile(__dirname + '/index.html');
})


io.on('connection', function(socket) {

	console.log(socket)
    //socket.emit('news', { port: port });
    // socket.on('my other event', function(data) {
    //     console.log(data);
    // });
    socket.on('disconnect', function() {
        io.emit('user disconnected');
    });//
});

server.listen(port, function() {
    console.log('listening on *:' + port);
});
