(function() {
  var StatsManager;

  StatsManager = require('./stats_manager');

  module.exports = {
    attachPeer: function(ws) {
      StatsManager.addConnection();
      return ws.on('close', function() {
        return StatsManager.removeConnection();
      });
    }
  };

}).call(this);
