var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var index = 1;
var port = 4000;
// var redis = require('socket.io-redis');
var socketioJwt = require('socketio-jwt');
var moment = require('moment');
var config = {
    port: 6379, // Redis port
    host: '127.0.0.1', // Redis host
    family: 4, // 4 (IPv4) or 6 (IPv6)
    db: 0
}
var Redis = require('ioredis');
var redis = new Redis(config);
var pub = new Redis(config);
var store = new Redis(config);
var snschat = new Redis(config);
var notification = new Redis(config);

snschat.subscribe("snschat");
notification.subscribe("notification")

pub.on("error", function(err) {
    console.log("Error " + err);
});

store.on("error", function(err) {
    console.log("Error " + err);
});

snschat.on("error", function(err) {
    console.log("Error " + err);
});



app.get('/', function(req, res) {
    console.log('aa' + index)
    index++;
    res.sendFile(__dirname + '/index.html');
})

app.get('/push', function(req, res) {

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
var sockets = {};

io.set('authorization', function(handshakeData, callback) {
    console.log(handshakeData._query.token)
    if (handshakeData._query.token == '123456' || handshakeData._query.token == '234567') {
        callback(null, true);

    } else {
        callback('error', false);
    }
})

io.sockets.on('connection', function(socket) {
    var address = socket.handshake.address;
    console.log(moment().format('YYYY-MM-DD HH:mm:ss') + ' New connection from ' + address + ',issued:' + socket.handshake.issued);
    //console.log('客户端连接成功，issued：' + socket.handshake.issued + ', ip：' + socket.handshake.headers['x-forwarded-for'])
    // console.log('加入房间号：' + socket.handshake.query.token);
    // socket.join(socket.handshake.query.token);
    //console.log(socket)

    socket.on('login', function(userinfo) {
        var userid = userinfo.myAuraId; //账号id

        var address = socket.handshake.address;
        var deviceid = userinfo.deviceId;
        console.log(moment().format('YYYY-MM-DD HH:mm:ss') + ' Login from ' + address + ',issued:' + socket.handshake.issued);
        // old_socket = sockets[userid];
        // console.log('old_socket:' + old_socket)
        socket.userid = userid;
        if (typeof sockets[userid] != 'undefined') { //已经登录了
            //socket.emit('logout');
            //
            sockets[userid].disconnect();
        }
        sockets[userid] = socket;
        redis.hmset('online', userid, socket.handshake.issued);
        socket.emit('login');
    })

    socket.on('geo', function(geo, ack) {

    })

    socket.on('disconnect', function(data) {
        if (data.indexOf('server') > -1) { //服务端断开socket
            console.log('server')
        } else {
            console.log('client')
            // var address = socket.handshake.address;
            // console.log(moment().format('YYYY-MM-DD HH:mm:ss') + ' Disconnect from ' + address.address + ":" + address.port);
            // if (!socket.relogin) {
            //     delete sockets[socket.userid]
            // }
            // 
            redis.hdel('online', socket.userid);
            delete sockets[socket.userid];
            console.log('delete:' + socket.userid)
        }
    });

    // setTimeout(function() {
    //     socket.emit('news', { port: port, handshake: socket });
    // }, 5000)
});

server.listen(port, function() {
    console.log('listening on *:' + port);
});

//初始化清空redis-online
redis.del('online');

setInterval(function() {
    redis.hgetall('online', function(err, result) {
        //console.log(result)
        if (err) {} else {
            var count = 0;
            for (var item in result) {
                count++;
            }
            io.sockets.emit('news', { port: port, handshake: result, count: count });
        }
    })
}, 1000);


function send_store_msg(socket, userid) {
    if (socket.isSendStoreMsg) {
        return;
    }
    socket.isSendingChatMessage = false;

    store.hget('chat_history', userid, function(e, msg) {
        if (msg) {
            send_msg(socket, msg);
            store.hdel('chat_history', socket.userid, function(e, r) {

            })
        }
    })

    store.hget('hodejs_notification', userid, function(e, msg) {
        if (msg) {
            var msglist = JSON.parse(msg);
            for (var i = 0; i < msglist.length; i++) {
                send_notification(socket, msglist[i]);
            }
        }
    })

    socket.isSendStoreMsg = true;
}
