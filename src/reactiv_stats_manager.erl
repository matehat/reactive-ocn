-module(reactiv_stats_manager).

%% Public API
-export([start_link/0, add_stats_receiver/0, delete_stats_receiver/0, emit_stat/1]).

%% gen_event Behavior callbacks
-export([init/1, handle_event/2, handle_call/2, handle_info/2, terminate/2, code_change/3]).


start_link() ->
    gen_event:start_link({local, ?MODULE}).

add_stats_receiver() ->
    gen_event:add_sup_handler(?MODULE, { ?MODULE, self() }, [self()]).

delete_stats_receiver() ->
    gen_event:delete_handler(?MODULE, { ?MODULE, self() }, []).

emit_stat(Stat) ->
    gen_event:notify(?MODULE, Stat).

init([WsPid]) -> {ok, WsPid}.

handle_event(Stat, WsPid) ->
    WsPid ! {stat, Stat},
    {ok, WsPid}.

handle_call(_Req, Pid) -> {ok, no_call_expected, Pid}.
handle_info(_Info, Pid) -> {ok, Pid}.

terminate(Arg, Pid) -> ok.

code_change(OldVsn, Pid, Extra) -> {ok, Pid}.
