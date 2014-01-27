/** @jsx React.DOM */

var addr = "ws://33.33.33.11:8080/";
var numConnections = 50;

var Connection = React.createClass({
    getInitialState: function () {
        return { 
            delay: parseFloat(this.props.delay),
            posted: [],
            id: this.props.key,
            received: false,
            open: false
        };
    },
    componentDidUpdate: function () {
        if (this.state.received) {
            var node = this.getDOMNode();
            node.className = '';
            setTimeout(function () { node.className = 'received'; }, 1);
        }
    },
    shouldComponentUpdate: function(nextProps, nextState) {
        return  nextState.received != this.state.received ||
                nextState.delay != this.state.delay ||
                nextState.open != this.state.open;
    },
    receivedMessage: function(delay) {
        if (!!delay) {
            this.setState({ delay: delay, received: true });
        } else {
            this.state.received = true;
            this.forceUpdate();
        }
    },
    socketStateChanged: function (open) {
        this.setState({ received: false, open: open });
    },
    
    render: function() {
        var styles = React.addons.classSet({ down: !this.state.open });
        return (
            <li className={styles} onClick={this.props.callback}><article>
                {sprintf("%d", this.state.delay)}{' '}
                <span className="units">ms</span>
            </article></li>
        );
    }
});

var Statistic = React.createClass({
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
            
            return this.setState({dt: newProps.dt});
        }
    },
    
    render: function() {
        var scale = this.state.scale;
        console.log(this.props.value);
        return (<article className="statistic">
            <section className="graph">{
                this.state.values.map(function (value) {
                    var relativeValue = value / scale * 100;
                    var styles = { 
                        height: relativeValue + 'px',
                        'margin-top': (100-relativeValue) + 'px'
                    };
                    return <div style={styles}><span></span></div>;
                })
            }</section>
            <section className="value">
                <span className="caption">{this.props.caption}</span>{' '}{this.props.value}{' '}
                <span className="units">{this.props.units}</span>
            </section>
        </article>);
    }
});

var Page = React.createClass({
    getInitialState: function() {
        var statsWS = new WebSocket(addr+"stats");
        
        statsWS.onmessage = this.receivedStats;
        statsWS.onclose = this.socketChangedState;
        statsWS.onopen = this.socketChangedState;
        var children = [];
        for (var i = 0; i < numConnections; i++) {
            children.push(Math.random()*100);
        }
        
        var connector = new  Worker('js/worker.js');
        connector.postMessage({url: addr, keys: children});
        connector.onmessage = this.receivedMessage;
        
        setInterval(this.tick, 500);
        return {
            stats: { cpu:       [0, 0],
                     memory:    [0, 0],
                     conn:      [0, 0], 
                     delay:     [0, 0] },
                     
            children: children,
            statsSocket: statsWS,
            connector: connector
        }
    },
    
    socketChangedState: function() {
        if (this.state.statsSocket.readyState == 1) {
            document.getElementsByTagName('body')[0].className = '';
        } else {
            document.getElementsByTagName('body')[0].className = 'down';
            setTimeout(this.reconnect, 300);
        }
    },
    reconnect: function () {
        var statsWS = new WebSocket(addr+"stats");
        statsWS.onmessage = this.receivedStats;
        statsWS.onclose = this.socketChangedState;
        statsWS.onopen = this.socketChangedState;
        this.setState({statsSocket: statsWS});
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
        } else if (stats.stat_name == 'message_delay') {
            this.state.stats.delay = [Date.now(), sprintf("%.2f", stats.value)];
            this.setState({});
        }
    },
    receivedMessage: function(event) {
        var key, method;
        if (!!(key = event.data.connection) && 
            !!(method = this.refs[key][event.data.method])) {
            method.apply(this.refs[key], event.data.args);
        }
    },
    
    clickedConnection: function(key) {
        this.state.connector.postMessage({post: key});
    },
    tick: function() {
        var randomKey = this.state.children[Math.floor(Math.random() * (this.state.children.length - 1))];
        this.clickedConnection(randomKey);
    },
    sendCrash: function(event) {
        
    },
    switchEnvironment: function(event) {
        
    },
    render: function() {
        var self = this;
        return (
            <section id="page">
                <header>
                    <div className="buttons">
                        <a className="button" href="#" onClick={ this.sendCrash }>Crash!</a>
                        <a className="button" href="#" onClick={ this.switchEnvironment }>Erlang</a>
                    </div>
                    <h1><strong>OpenCode</strong> Réactif</h1>
                    <div id="statistics">
                        <Statistic caption="Mém" scale="40" 
                            dt={ this.state.stats.memory[0] } 
                            value={ this.state.stats.memory[1] } 
                            units="MB" />
                        
                        <Statistic caption="CPU" scale="100" 
                            dt={ this.state.stats.cpu[0] } 
                            value={ this.state.stats.cpu[1] } 
                            units="%" />
                        
                        <Statistic caption="Delai" scale="20"
                            dt={ this.state.stats.delay[0] } 
                            value={ this.state.stats.delay[1] } 
                            units="ms" />
                        
                        <Statistic caption="Conn" scale="100"
                            dt={ this.state.stats.conn[0] } 
                            value={ this.state.stats.conn[1] } 
                            units="" />
                    </div>
                </header>
                <ul id="connections">{this.state.children.map(function(key) {
                    return <Connection delay="0" 
                                callback={self.clickedConnection.bind(self, key)} 
                                key={key} ref={key} />
                })}</ul>
            </section>
        );
    }
});

React.renderComponent( <Page />, document.getElementsByTagName("body")[0] );