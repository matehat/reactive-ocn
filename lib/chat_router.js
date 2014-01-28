(function() {
  var MAX_MEMBERS, PriorityQueue, StatsManager, WS_OPEN, attach, detach, makeQueue, makeUUID, publish, trace;

  PriorityQueue = require('pqueue');

  makeUUID = require('uuid').v4;

  StatsManager = require('./stats_manager');

  WS_OPEN = 1;

  makeQueue = function() {
    return new PriorityQueue({
      priority: function(o) {
        return o.discriminant;
      }
    });
  };

  MAX_MEMBERS = 100;

  trace = function(node) {
    if (node instanceof PriorityQueue) {
      return {
        size: node.length
      };
    } else {
      return {
        left: trace(node.left),
        right: trace(node.right)
      };
    }
  };

  attach = function(node, peer) {
    var bottomHalf, bottomQueue, discriminant, id, median;
    discriminant = peer.discriminant, id = peer.id;
    if (node instanceof PriorityQueue) {
      node.push(peer);
      if (node.length < MAX_MEMBERS) {
        return node;
      } else {
        bottomHalf = node.shift(Math.floor(MAX_MEMBERS / 2));
        bottomQueue = makeQueue();
        bottomQueue._queue = bottomHalf;
        median = node.bottom.discriminant;
        return {
          median: median,
          left: bottomQueue,
          right: node
        };
      }
    } else if ((median = node.median) != null) {
      if (discriminant < median) {
        node.left = attach(node.left, peer);
        return node;
      } else {
        node.right = attach(node.right, peer);
        return node;
      }
    }
  };

  detach = function(node, peer) {
    var discriminant, id, median, peers;
    discriminant = peer.discriminant, id = peer.id;
    if (node instanceof PriorityQueue) {
      node._queue = node.queue.filter(function(_arg) {
        var _id;
        _id = _arg.id;
        return _id !== id;
      });
      return node;
    } else if ((median = node.median) != null) {
      if (discriminant < median) {
        node.left = detach(node.left, peer);
      } else {
        node.right = detach(node.right, peer);
      }
      if (node.left instanceof PriorityQueue && node.right instanceof PriorityQueue && (node.left.length + node.right.length) < MAX_MEMBERS) {
        peers = node.right.queue;
        peers.unshift.apply(peers, node.left.queue);
        return node.right;
      } else {
        return node;
      }
    }
  };

  publish = function(node, discriminant, ts) {
    var median, ws, _i, _len, _ref;
    if (node instanceof PriorityQueue) {
      _ref = node.queue;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ws = _ref[_i].ws;
        if (ws.readyState === WS_OPEN) {
          ws.send(JSON.stringify({
            event: ts
          }));
        }
      }
    } else if ((median = node.median) != null) {
      if (discriminant < median) {
        publish(node.left, discriminant, ts);
      } else {
        publish(node.right, discriminant, ts);
      }
    }
    return null;
  };

  module.exports = {
    router: makeQueue(),
    attachPeer: function(ws, request) {
      var peer;
      peer = {
        ws: ws,
        id: makeUUID(),
        discriminant: request.query.d
      };
      module.exports.router = attach(module.exports.router, peer);
      ws.on('close', function() {
        return module.exports.router = detach(module.exports.router, peer);
      });
      return ws.on('message', function(data) {
        var delay, ts, _ref;
        _ref = JSON.parse(data), ts = _ref.post, delay = _ref.delay;
        if (ts != null) {
          return publish(module.exports.router, peer.discriminant, ts);
        } else if (delay != null) {
          return StatsManager.recordDelay(delay);
        }
      });
    }
  };

}).call(this);
