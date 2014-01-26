-module(reactiv_vm_stats_emitter).

-export([start_link/0]).

-define(STAT_INTERVAL, 1000).

start_link() ->
    Pid = spawn_link(fun init/0),
    {ok, Pid}.

init() ->
    erlang:system_flag(scheduler_wall_time, true),
    loop(lists:sort(erlang:statistics(scheduler_wall_time))).
    
loop(Ts0) ->
    erlang:send_after(?STAT_INTERVAL, self(), emit),
    receive
        emit ->
            TotalMemory = proplists:get_value(total, folsom_vm_metrics:get_memory()),
            reactiv_stats_manager:emit_stat({memory, TotalMemory}),
            Ts1 = lists:sort(erlang:statistics(scheduler_wall_time)),
            {A, T} = lists:foldl(fun({{_, A0, T0}, {_, A1, T1}}, {Ai,Ti}) ->
            	{Ai + (A1 - A0), Ti + (T1 - T0)} end, {0, 0}, lists:zip(Ts0,Ts1)), 
            CPU = A/T,
            reactiv_stats_manager:emit_stat({cpu, CPU}),
            loop(Ts1)
    end.
