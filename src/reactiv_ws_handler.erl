-module(reactiv_ws_handler).
-behaviour(cowboy_websocket_handler).
 
-export([init/3,
         websocket_init/3,
         websocket_handle/3,
         websocket_info/3,
         websocket_terminate/3]).
 
 
 
init({tcp, http}, Req, Opts) ->
    {upgrade, protocol, cowboy_websocket}.
 
 
 
 
websocket_init(TransportName, Req, _Opts) ->
    erlang:start_timer(1000, self(), <<"Hello!">>),
    {ok, Req, undefined_state}.
 
 
 
 
websocket_handle({text, Msg}, Req, State) ->
    {reply, {text, << "That's what she said! ", Msg/binary >>}, Req, State};

websocket_handle(_Data, Req, State) ->
    {ok, Req, State}.
 
 
 
 
websocket_info({timeout, _Ref, Msg}, Req, State) ->
    erlang:start_timer(1000, self(), <<"Hey you!?">>),
    {reply, {text, Msg}, Req, State};

websocket_info(_Info, Req, State) ->
    {ok, Req, State}.
 
 
 
 
websocket_terminate(_Reason, _Req, _State) ->
    ok.