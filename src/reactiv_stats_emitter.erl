-module(reactiv_stats_emitter).

-export([start_link/0, loop/0]).

-define(STAT_INTERVAL, 1000).

start_link() ->
    Pid = spawn_link(fun init/0),
    {ok, Pid}.

init() ->
    cpu_sup:start(),
    ?MODULE:loop().
    
loop() ->
    erlang:send_after(?STAT_INTERVAL, self(), emit),
    receive
        emit ->
            reactiv_stats_manager:emit_stat({connection_count, folsom_metrics:get_metric_value(connection_count)}),
            
            % DelayHist = folsom_metrics:get_histogram_statistics(message_delay),
            % reactiv_stats_manager:emit_stat({message_delay, proplists:get_value(harmonic_mean, DelayHist)}),
            reactiv_stats_manager:emit_stat({message_delay, 0.1}),
            
            TotalMemory = proplists:get_value(total, folsom_vm_metrics:get_memory()),
            reactiv_stats_manager:emit_stat({memory, TotalMemory}),
            
            reactiv_stats_manager:emit_stat({cpu, cpu_sup:util()}),
            ?MODULE:loop()
    end.
