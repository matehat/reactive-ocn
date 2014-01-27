-module(reactiv_app).

-behaviour(application).

%% Application callbacks
-export([start/2, stop/1]).

%% ===================================================================
%% Application callbacks
%% ===================================================================

start(_StartType, _StartArgs) ->
    Res = reactiv_sup:start_link(),
    
    folsom_metrics:new_counter(connection_count),
    folsom_metrics:new_histogram(message_delay, exdec, 1024, 0.15),
    
    Dispatch = cowboy_router:compile([
        {'_', [
            {"/stats", reactiv_ws_stats_handler, []},
            {"/chat", reactiv_ws_handler, []}
        ]}
    ]),
    {ok, _} = cowboy:start_http(http, 500, [{port, 8080}],
        [{env, [{dispatch, Dispatch}]}]),
    Res.

stop(_State) ->
    ok.
