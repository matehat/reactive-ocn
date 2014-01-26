/** @jsx React.DOM */
var addr = "ws://33.33.33.11:8080/stats";
var Connection = React.createClass({displayName: 'Connection',
    getInitialState: function () {
        return { delay: this.props.delay, updated: false };
    },
    componentWillReceiveProps: function (newProps) {
        return this.setState({ delay: newProps.delay, updated: newProps.delay != this.props.delay });
    },
    shouldComponentUpdate: function (newProps, newState) {
        return newState.updated;
    },
    componentDidUpdate: function () {
        if (this.state.updated) {
            var node = this.getDOMNode();
            node.className = '';
            setTimeout(function () { node.className = 'updated'; }, 1);
        }
    },
    
    render: function() {
        return (
            React.DOM.li(null, React.DOM.article(null, sprintf("%.1f", this.props.delay),' ',React.DOM.span( {className:"units"}, "ms")))
        );
    }
});
var Statistic = React.createClass({displayName: 'Statistic',
    getInitialState: function () {
        values = [];
        for (var i = 0; i < 12; i++)
            values.push(0);
        
        return { values: values, dt: Date.now(), scale: this.props.scale };
    },
    componentWillReceiveProps: function (newProps) {
        if (newProps.dt != this.state.dt) {
            var newValue = parseFloat(newProps.value);
            values = this.state.values;
            values.push(newValue);
            values.shift();
            var max = Math.max.apply(Math, values);
            if (max > this.props.scale) {
                this.setState({scale: max * 2});
            }
            console.log("Scale ", max, this.state.scale)
            
            return this.setState({dt: newProps.dt});
        }
    },
    
    render: function() {
        var scale = this.state.scale;
        return (React.DOM.article( {className:"statistic"}, 
            React.DOM.section( {className:"graph"}, 
                this.state.values.map(function (value) {
                    var relativeValue = value / scale * 100;
                    var styles = { 
                        height: relativeValue + 'px',
                        'margin-top': (100-relativeValue) + 'px'
                    };
                    return React.DOM.div( {style:styles}, React.DOM.span(null));
                })
            ),
            React.DOM.section( {className:"value"}, 
                React.DOM.span( {className:"caption"}, this.props.caption),' ',this.props.value,' ',
                React.DOM.span( {className:"units"}, this.props.units)
            )
        ));
    }
});

var Page = React.createClass({displayName: 'Page',
    getInitialState: function() {
        var delays = [];
        
        for (var i = 0; i < 100; i++)
            delays[i] = Math.random() * 9;
        
        var statsWS = new WebSocket(addr);
        statsWS.onmessage = this.receivedStats;
        
        return {
            delays: delays,
            stats: { cpu:       [0, 0],
                     memory:    [0, 0],
                     conn:      [0, 0], 
                     delay:     [0, 0] },
                     
            statsSocket: statsWS
        }
    },
    receivedStats: function (msg) {
        var stats = JSON.parse(msg.data);
        if (stats.stat_name == 'memory') {
            this.state.stats.memory = [Date.now(), sprintf("%.2f", stats.value / 1048576)];
            this.setState({});
        } else if (stats.stat_name == 'cpu') {
            this.state.stats.cpu = [Date.now(), sprintf("%.2f", stats.value)];
            this.setState({});
        } else if (stats.stat_name == 'connection_count') {
            this.state.stats.conn = [Date.now(), stats.value];
            this.setState({});
        }
    },
    tick: function() {
        var i = Math.floor((Math.random() * 99.9));
        this.state.delays[i] = Math.random() * 9;
        this.setState({});
    },
    sendCrash: function(event) {
        
    },
    switchEnvironment: function(event) {
        
    },
    render: function() {
        return (
            React.DOM.section( {id:"page"}, 
            
                React.DOM.header(null, 
                    React.DOM.div( {className:"buttons"}, 
                        React.DOM.a( {className:"button", href:"#", onClick: this.sendCrash }, "Crash!"),
                        React.DOM.a( {className:"button", href:"#", onClick: this.switchEnvironment }, "Erlang")
                    ),
                    React.DOM.h1(null, React.DOM.strong(null, "OpenCode"), " Réactif"),
                    React.DOM.div( {id:"statistics"}, 
                        Statistic( {caption:"Mém", scale:"100", 
                            dt: this.state.stats.memory[0],  
                            value: this.state.stats.memory[1],  
                            units:"MB"} ),
                        
                        Statistic( {caption:"CPU", scale:"100", 
                            dt: this.state.stats.cpu[0],  
                            value: this.state.stats.cpu[1],  
                            units:"%"} ),
                        
                        Statistic( {caption:"Delai", scale:"100",
                            dt: this.state.stats.delay[0],  
                            value: this.state.stats.delay[1],  
                            units:"ms"} ),
                        
                        Statistic( {caption:"Conn", scale:"100",
                            dt: this.state.stats.conn[0],  
                            value: this.state.stats.conn[1],  
                            units:""} )
                    )
                ),
                
                React.DOM.ul( {id:"connections"}, 
                this.state.delays.map(function(delay) { 
                    return Connection( {delay:delay} ) 
                }))
            )
        );
    }
});

React.renderComponent( Page(null ), document.getElementsByTagName("body")[0] );