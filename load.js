var WebSocket = require('ws');
var N;

if (process.argv.length >= 3) {
    N = parseInt(process.argv[2]);
    if (Number.isNaN(N)) N = undefined;
}
if (N == undefined) N = 500;

var addr;
if (process.argv.length >= 4) {
    addr = process.argv[3];
} else {
    addr = "storm-dev.storm.io:8080";
}

function newSocket(j) {
    var socket = new WebSocket("ws://"+addr+"/chat?d="+ (100*Math.random()));
    socket.on('error', function (err) {
        console.log(err);
        sockets[j] = newSocket(j);
    });
    return socket;
}

sockets = [];
for (var i = 0; i < N; i++) {
    sockets[i] = newSocket(i);
}

function fire() {
    var idx = Math.floor(Math.random() * (sockets.length - 0.5));
    var socket = sockets[idx];
    if (socket.readyState == 1) {
        socket.send(JSON.stringify({post: Date.now()}));
    }
}

setInterval(fire, 50);