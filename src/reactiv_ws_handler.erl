-module(reactiv_ws_handler).
-behaviour(cowboy_websocket_handler).
 
-export([init/3,
         websocket_init/3,
         websocket_handle/3,
         websocket_info/3,
         websocket_terminate/3]).
 
 
 
init({tcp, http}, _Req, _Opts) ->
    folsom_metrics:notify({connection_count, {inc, 1}}),
    {upgrade, protocol, cowboy_websocket}.




websocket_init(_TransportName, Req, _Opts) ->
    {DiscriminantBin, _} = cowboy_req:qs_val(<<"d">>, Req),
    Discriminant = binary_to_float(DiscriminantBin),
    reactiv_router:new_recipient(Discriminant),
    {ok, Req, {id, Discriminant}}.




websocket_handle({text, Msg}, Req, State={id, Discriminant}) ->
    case jiffy:decode(Msg) of
        {[{<<"delay">>, Delay}]} ->
            % io:format("Delay: ~w~n", [Delay]),
            folsom_metrics:notify({message_delay, Delay});
        {[{<<"post">>, Token }]} ->
            reactiv_router:post(Discriminant, Token)
    end,
    {ok, Req, State};

websocket_handle(_Data, Req, State) ->
    {ok, Req, State}.




websocket_info({event, Msg}, Req, State) ->
    {reply, {text, jiffy:encode({[{<<"event">>, Msg}]})}, Req, State};
websocket_info(_Info, Req, State) ->
    {ok, Req, State}.




websocket_terminate(_Reason, _Req, {id, Discriminant}) ->
    folsom_metrics:notify({connection_count, {dec, 1}}),
    reactiv_router:remove_recipient(Discriminant),
    ok.
