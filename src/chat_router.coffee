StatsManager = require './stats_manager'

module.exports = 
  attachPeer: (ws) ->
    StatsManager.addConnection()
    ws.on 'close', -> 
      StatsManager.removeConnection()
    
    

