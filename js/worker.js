var keys, url,
    connections = {},
    timestamps = {};

function connect(key) {
    var ws = new WebSocket(url + "chat?d=" + key);
    connections[key] = ws;
    ws.onopen = open.bind(self, key);
    ws.onmessage = message.bind(self, key);
    ws.onclose = close.bind(self, key);
}
function open(key) {
    postMessage({connection: key, method: 'socketStateChanged', args: [connections[key.toString()].readyState == 1]});
}
function message(key, event) {
    var value = JSON.parse(event.data),
        ts = value.event,
        senderKey;
    
    if ((senderKey = timestamps[ts.toString()])) {
        delay = Date.now() - ts;
        if (senderKey == key) {
            postMessage({connection: key, method: 'receivedMessage', args: [delay]});
            var ws = connections[key.toString()];
            if (ws.readyState == 1) {
                ws.send(JSON.stringify({delay: delay}));
            }
            delete timestamps[key.toString()];
        } else {
            postMessage({connection: key, method: 'receivedMessage', args: []});
        }
    }
}
function close(key) {
    postMessage({connection: key, method: 'socketStateChanged', args: [false]});
    setTimeout(connect, Math.random()*300, key);
}

onmessage = function (event) {
    var key, raw;
    if (event.data.url != null) {
        url = event.data.url;
        event.data.keys.forEach(connect);
    } else if ((key = event.data.post) != null) {
        var ws = connections[key.toString()];
        if (ws.readyState == 1) {
            var ts = Date.now();
            ws.send(JSON.stringify({post: ts}));
            timestamps[ts.toString()] = key;
        }
    } else if ((raw = event.data.raw) != null &&
               (key = event.data.key)) {
                  
        var ws = connections[key.toString()];
        if (ws.readyState == 1) {
            ws.send(raw);
        }
    }
}