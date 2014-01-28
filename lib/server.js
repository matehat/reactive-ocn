(function() {
  var ChatRouter, Server, StatsManager, router, url, wss;

  Server = require('ws').Server;

  url = require('url');

  ChatRouter = require('./chat_router');

  StatsManager = require('./stats_manager');

  router = {
    '/chat': function(ws, request) {
      StatsManager.addConnection(ws);
      return ChatRouter.attachPeer(ws, request);
    },
    '/stats': function(ws) {
      return StatsManager.addListener(ws);
    }
  };

  (wss = new Server({
    port: 8080
  })).on('connection', function(ws) {
    var request, route;
    request = url.parse(ws.upgradeReq.url, true);
    if ((route = router[request.pathname]) != null) {
      return route(ws, request);
    } else {
      return ws.close();
    }
  });

}).call(this);
