/** @jsx React.DOM */

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
            React.DOM.li( {className:""}, React.DOM.article(null, sprintf("%.1f", this.props.delay),' ',React.DOM.span( {className:"units"}, "ms")))
        );
    }
});
var Statistic = React.createClass({displayName: 'Statistic',
    render: function() {
        return (React.DOM.div( {id:"memory"}, 
            React.DOM.span( {className:"caption"}, this.props.caption),' ',this.props.value,' ',
            React.DOM.span( {className:"units"}, this.props.units)
        ));
    }
});

var Page = React.createClass({displayName: 'Page',
    getInitialState: function() {
        var delays = [];
        
        for (var i = 0; i < 100; i++)
            delays[i] = Math.random() * 9;
        
        var statsWS = new WebSocket("ws://33.33.33.11:8080/stats");
        statsWS.onmessage = this.receivedStats;
        
        return {
            delays: delays,
            stats: { cpu: 0,
                     memory: 0 },
            statsSocket: statsWS
        }
    },
    receivedStats: function (msg) {
        var stats = JSON.parse(msg.data);
        if (stats.stat_name == 'memory') {
            this.state.stats.memory = sprintf("%.2f", stats.value / 1048576);
            this.setState({});
        } else if (stats.stat_name == 'cpu') {
            this.state.stats.cpu = sprintf("%.2f", stats.value);
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
                        Statistic( {caption:"Mém", value: this.state.stats.memory,  units:"MB"} ),
                        Statistic( {caption:"CPU", value: this.state.stats.cpu,  units:"%"} ),
                        Statistic( {caption:"Delai", value:"1.2", units:"ms"} ),
                        Statistic( {caption:"Conn", value:"1500", units:""} )
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