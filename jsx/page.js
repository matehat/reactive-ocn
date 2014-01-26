/** @jsx React.DOM */

var Connection = React.createClass({
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
            <li className="">{sprintf("%.1f", this.props.delay)}{' '}<span className="units">ms</span></li>
        );
    }
});
var Statistic = React.createClass({
    render: function() {
        return (<div id="memory">
            <span className="caption">{this.props.caption}</span>{' '}{this.props.value}{' '}
            <span className="units">{this.props.units}</span>
        </div>);
    }
});

var Page = React.createClass({
    getInitialState: function() {
        var delays = [];
        // setInterval(this.tick, 100);
        for (var i = 0; i < 100; i++) {
            delays[i] = Math.random() * 9;
        }
        
        var statsWS = new WebSocket("ws://localhost:8080/stats");
        statsWS.onmessage = this.receivedStats;
        
        return { 
            delays: delays, 
            stats: {
                cpu: 0,
                memory: 0
            },
            statsSocket: statsWS
        }
    },
    receivedStats: function (msg) {
        var stats = JSON.parse(msg.data);
        if (stats.stat_name == 'memory') {
            this.state.stats.memory = sprintf("%.2f", stats.value / 1048576);
            this.setState({});
        } else if (stats.stat_name == 'cpu') {
            this.state.stats.cpu = sprintf("%.2f", stats.value * 10000 );
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
            <section id="page">
                <header>
                    <div className="buttons">
                        <a className="button" href="#" onClick={ this.sendCrash }>Crash!</a>
                        <a className="button" href="#" onClick={ this.switchEnvironment }>Erlang</a>
                    </div>
                    <h1><strong>OpenCode</strong> Réactif</h1>
                    <div id="statistics">
                        <Statistic caption="Mém" value={ this.state.stats.memory } units="MB" />
                        <Statistic caption="CPU" value={ this.state.stats.cpu } units="%" />
                        <Statistic caption="Delai" value="1.2" units="ms" />
                        <Statistic caption="Conn" value="1500" units="" />
                    </div>
                </header>
                <ul id="connections">
                {this.state.delays.map(function(delay) { 
                    return <Connection delay={delay} /> 
                })}</ul>
            </section>
        );
    }
});

React.renderComponent( <Page />, document.getElementsByTagName("body")[0] );