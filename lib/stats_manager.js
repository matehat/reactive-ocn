(function() {
  var Counter, Histogram, StatEmitter, connections, cpu, delays, emit, memory, sockets, _ref;

  _ref = require('metrics'), Histogram = _ref.Histogram, Counter = _ref.Counter;

  StatEmitter = require('./stats_emitter');

  sockets = [];

  module.exports = {
    addListener: function(ws) {
      ws.on('close', function() {
        var idx;
        if ((idx = sockets.indexOf(ws)) !== -1) {
          return sockets.splice(idx, 1);
        }
      });
      return sockets.push(ws);
    },
    addConnection: function() {
      return connections.source.inc(1);
    },
    removeConnection: function() {
      return connections.source.dec(1);
    }
  };

  emit = function() {
    var stat, stats, ws, _i, _j, _len, _len1;
    if (!(sockets.length > 0)) {
      return;
    }
    stats = [delays(), connections(), cpu(), memory()];
    for (_i = 0, _len = sockets.length; _i < _len; _i++) {
      ws = sockets[_i];
      for (_j = 0, _len1 = stats.length; _j < _len1; _j++) {
        stat = stats[_j];
        ws.send(stat);
      }
    }
    return null;
  };

  setInterval(emit, 1000);

  delays = StatEmitter(Histogram.createExponentialDecayHistogram(1024, 0.15), 'message_delay', function(hist) {
    return hist.mean();
  });

  connections = StatEmitter(new Counter(), 'connection_count', function(counter) {
    return counter.count;
  });

  cpu = StatEmitter(require('os'), 'cpu', function(os) {
    var i, idle, idle0, idle1, load, now, occ, occ0, occ1, sys, user, _i, _j, _len, _len1, _ref1, _ref2, _ref3, _ref4;
    now = (function() {
      var _i, _len, _ref1, _ref2, _results;
      _ref1 = os.cpus();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        _ref2 = _ref1[_i].times, user = _ref2.user, sys = _ref2.sys, idle = _ref2.idle;
        _results.push([user + sys, idle]);
      }
      return _results;
    })();
    load = 0;
    if (cpu.previous == null) {
      for (_i = 0, _len = now.length; _i < _len; _i++) {
        _ref1 = now[_i], occ = _ref1[0], idle = _ref1[1];
        load += occ / idle;
      }
    } else {
      _ref2 = cpu.previous;
      for (i = _j = 0, _len1 = _ref2.length; _j < _len1; i = ++_j) {
        _ref3 = _ref2[i], occ0 = _ref3[0], idle0 = _ref3[1];
        _ref4 = now[i], occ1 = _ref4[0], idle1 = _ref4[1];
        load += (occ1 - occ0) / (idle1 - idle0);
      }
    }
    cpu.previous = now;
    return (load / now.length) * 100;
  });

  memory = StatEmitter(null, 'memory', function() {
    return process.memoryUsage().rss;
  });

}).call(this);
