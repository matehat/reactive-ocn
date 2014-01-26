-module(reactiv_ws_stats_handler).
-behaviour(cowboy_websocket_handler).
 
-export([init/3,
         websocket_init/3,
         websocket_handle/3,
         websocket_info/3,
         websocket_terminate/3]).
 
 
 
init({tcp, http}, Req, Opts) ->
    reactiv_stats_manager:add_stats_receiver(),
    {upgrade, protocol, cowboy_websocket}.


websocket_init(TransportName, Req, _Opts) -> {ok, Req, undefined_state}.
websocket_handle(_Data, Req, State) -> {ok, Req, State}.




websocket_info({stat, {cpu, StatValue}}, Req, State) ->
    {reply, send_to_client(cpu, StatValue), Req, State};
    
websocket_info({stat, {memory, StatValue}}, Req, State) ->
    {reply, send_to_client(memory, StatValue), Req, State};
    
websocket_info({stat, {num_conn, StatValue}}, Req, State) ->
    {reply, send_to_client(num_conn, StatValue), Req, State};

websocket_info(_Info, Req, State) ->
    {ok, Req, State}.
 
 

websocket_terminate(_Reason, _Req, _State) ->
    reactiv_stats_manager:delete_stats_receiver().


%% Private functions

send_to_client(StatName, Value) ->
    {text, jiffy:encode({[ {stat_name, StatName},  {value, Value} ]})}.
