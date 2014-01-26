-module(reactiv_vm_stats_emitter).

-export([start_link/0]).

-define(STAT_INTERVAL, 1000).

start_link() ->
    Pid = spawn_link(fun init/0),
    {ok, Pid}.

init() ->
    cpu_sup:start(),
    loop().
    
loop() ->
    erlang:send_after(?STAT_INTERVAL, self(), emit),
    receive
        emit ->
            TotalMemory = proplists:get_value(total, folsom_vm_metrics:get_memory()),
            reactiv_stats_manager:emit_stat({memory, TotalMemory}),
            reactiv_stats_manager:emit_stat({cpu, cpu_sup:util()}),
            loop()
    end.
