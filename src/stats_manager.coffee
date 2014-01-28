{Histogram, Counter} = require 'metrics'
StatEmitter = require './stats_emitter'

WS_OPEN = 1
sockets = []
module.exports =
  addListener: (ws) ->
    ws.on 'close', ->
      if (idx = sockets.indexOf ws) isnt -1
        sockets.splice idx, 1
    
    sockets.push ws
  
  addConnection: (ws) -> 
    connections.source.inc 1
    ws.on 'close', -> connections.source.dec 1
  
  recordDelay: (delay) ->
    delays.source.update delay

emit = ->
  return unless sockets.length > 0
  stats = [ delays(), connections(), cpu(), memory() ]
  for ws in sockets when ws.readyState == WS_OPEN
    ws.send stat for stat in stats 
  
  null

setInterval emit, 1000

delays = StatEmitter Histogram.createExponentialDecayHistogram(1024, 0.15), 'message_delay', (hist) ->
  hist.mean()

connections = StatEmitter new Counter(), 'connection_count', (counter) ->
  counter.count

cpu = StatEmitter require('os'), 'cpu', (os) ->
  now = ([user+sys, idle] for {times: {user, sys, idle}} in os.cpus())
  load = 0
  
  if !cpu.previous?
    for [occ, idle] in now
      load += occ / idle
  else
    for [occ0, idle0], i in cpu.previous
      [occ1, idle1] = now[i]
      load += (occ1 - occ0) / (idle1 - idle0)
  
  cpu.previous = now
  (load / now.length) * 100

memory = StatEmitter null, 'memory', ->
  process.memoryUsage().rss

