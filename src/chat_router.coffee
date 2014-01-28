PriorityQueue = require 'pqueue'
{v4: makeUUID} = require 'uuid'
StatsManager = require './stats_manager'

WS_OPEN = 1
makeQueue = -> new PriorityQueue priority: (o) -> o.discriminant
MAX_MEMBERS = 100

trace = (node) ->
  if node instanceof PriorityQueue
    size: node.length
  else
    left: trace node.left
    right: trace node.right

attach = (node, peer) ->
  {discriminant, id} = peer
  if node instanceof PriorityQueue
    node.push peer
    if node.length < MAX_MEMBERS 
      node
    else
      bottomHalf = node.shift Math.floor(MAX_MEMBERS / 2)
      bottomQueue = makeQueue()
      bottomQueue._queue = bottomHalf
      median = node.bottom.discriminant
      {median, left: bottomQueue, right: node}
  
  else if (median = node.median)?
    if discriminant < median
      node.left = attach node.left, peer
      node
    
    else
      node.right = attach node.right, peer
      node

detach = (node, peer) ->
  {discriminant, id} = peer
  if node instanceof PriorityQueue
    node._queue = node.queue.filter ({id: _id}) -> _id != id
    node
  
  else if (median = node.median)?
    if discriminant < median
      node.left = detach node.left, peer
    else
      node.right = detach node.right, peer
    
    if node.left instanceof PriorityQueue and
       node.right instanceof PriorityQueue and
       (node.left.length + node.right.length) < MAX_MEMBERS
       
      peers = node.right.queue
      peers.unshift.apply peers, node.left.queue
      node.right
    else
      node

publish = (node, discriminant, ts) ->
  if node instanceof PriorityQueue
    for {ws} in node.queue when ws.readyState == WS_OPEN 
      ws.send JSON.stringify event: ts
    
  else if (median = node.median)?
    if discriminant < median
      publish node.left, discriminant, ts
    else
      publish node.right, discriminant, ts
  
  null

module.exports =
  router: makeQueue()
  attachPeer: (ws, request) ->
    peer = {ws, id: makeUUID(), discriminant: request.query.d}
    module.exports.router = attach module.exports.router, peer
    
    ws.on 'close', -> 
      module.exports.router= detach module.exports.router, peer
    
    ws.on 'message', (data) ->
      {post: ts, delay} = JSON.parse data
      
      if ts?
        publish module.exports.router, peer.discriminant, ts
        
      else if delay?
        StatsManager.recordDelay delay

