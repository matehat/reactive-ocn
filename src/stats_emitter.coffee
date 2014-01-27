module.exports = (source, stat_name, fun) ->
  emitter = -> JSON.stringify { stat_name, value: fun(source) }
  emitter.source = source
  emitter
