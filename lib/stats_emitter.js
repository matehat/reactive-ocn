(function() {

  module.exports = function(source, stat_name, fun) {
    var emitter;
    emitter = function() {
      return JSON.stringify({
        stat_name: stat_name,
        value: fun(source)
      });
    };
    emitter.source = source;
    return emitter;
  };

}).call(this);
