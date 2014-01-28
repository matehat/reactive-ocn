{Server} = require 'ws'
url = require 'url'

ChatRouter   = require './chat_router'
StatsManager = require './stats_manager'

router =
    '/chat': (ws, request) ->
      StatsManager.addConnection ws
      ChatRouter.attachPeer ws, request
    
    '/stats': (ws) -> 
      StatsManager.addListener ws

(wss = new Server port: 8080).on 'connection', (ws) ->
    request = url.parse ws.upgradeReq.url, true
    if (route = router[request.pathname])?
        route ws, request
    else
        ws.close()
    
