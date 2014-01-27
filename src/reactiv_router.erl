-module(reactiv_router).
-behaviour(gen_fsm).

-export([start_link/1, 
         new_recipient/1,
         remove_recipient/1,
         post/2, 
         trace/0]).

-export([init/1,
         pending/2, pending/3,
         leaf/2,    leaf/3,
         node/2,    node/3,
         handle_event/3,
         handle_sync_event/4,
         handle_info/3,
         terminate/3,
         code_change/4]).

-define(MAX_MEMBERS, 100).

-record(recipient, {
    discriminant :: float(),
    ws_pid       :: pid()
}).

-record(state, {
    recipients = undefined  :: list(#recipient{}) | integer(),
    median     = undefined  :: float(),
    children                :: list(pid()),
    root                    :: boolean(),
    parent                  :: pid()
}).

-define(SELECT_CHILD(Children, Threshold, Discriminant), if
    Discriminant > Threshold -> lists:nth(2, Children);
    true                     -> lists:nth(1, Children)
end).



start_link(true) ->
    gen_fsm:start_link({local, ?MODULE}, ?MODULE, [true], []);
start_link(false) ->
    gen_fsm:start_link(?MODULE, [false], []).



new_recipient(Discriminant) ->
    new_recipient(?MODULE, Discriminant).
new_recipient(Ref, Recipient=#recipient{}) ->
    gen_fsm:send_event(Ref, Recipient);
new_recipient(Ref, Discriminant) ->
    gen_fsm:send_event(Ref, #recipient{ ws_pid = self(), discriminant = Discriminant }).



remove_recipient(Discriminant) ->
    remove_recipient(?MODULE, self(), Discriminant).
remove_recipient(Ref, Pid, Discriminant) ->
    gen_fsm:sync_send_event(Ref, {remove_recipient, Pid, Discriminant}).



post(Discriminant, Token) ->
    post(?MODULE, Discriminant, Token).
post(Ref, Discriminant, Token) ->
    gen_fsm:send_event(Ref, {post, Discriminant, Token}).



trace() -> 
    { whereis(router_root), trace(?MODULE) }.
trace(Ref) ->
    gen_fsm:sync_send_event(Ref, trace).
    
    

get_count(Pid) ->
    gen_fsm:sync_send_event(Pid, get_count).



init([Root]) ->
    process_flag(trap_exit, true),
    if  
        Root ->
            {ok, leaf, #state{root=true, recipients=[]}};
        true ->
            {ok, pending, #state{root=false}}
    end.



pending(_, State) ->
    {next_state, pending, State}.

pending({recipients, RecipientList}, _From, State=#state{recipients=undefined, root=false}) ->
    % io:format("[~w] Received recipients [~w]~n", [self(), length(RecipientList)]),
    {reply, ok, leaf, State#state{ recipients = RecipientList }}.



leaf({post, _Discriminant, Token}, State=#state{recipients=Recipients}) ->
    lists:foreach(fun
        (#recipient{ws_pid=Pid}) -> Pid ! {event, Token}
    end, Recipients),
    {next_state, leaf, State};
    
leaf(Recipient=#recipient{}, State=#state{recipients=Recipients}) ->
    Recipients0 = lists:keymerge(#recipient.discriminant, Recipients, [Recipient]),
    if  
        length(Recipients) < ?MAX_MEMBERS - 1 ->
            % io:format("[~w] Number of members still sufficiently low ~w ~n", [self(), length(Recipients0)]),
            {next_state, leaf, State#state{ recipients = Recipients0 }};
        
        true ->
            { Recipients1, [MedianRecipient = #recipient{discriminant=Median} | Recipients2] } = 
                lists:split(trunc(?MAX_MEMBERS / 2)-1, Recipients0),
            
            { ok, Child1 } = reactiv_router_sup:start_router(),
            link(Child1),
            ok = gen_fsm:sync_send_event(Child1, {recipients, Recipients1 ++ [MedianRecipient]}),
            
            { ok, Child2 } = reactiv_router_sup:start_router(),
            link(Child2),
            ok = gen_fsm:sync_send_event(Child2, {recipients, Recipients2}),
            
            % io:format("[~w]Splitting router using ~w ~n", [self(), Median]),
            
            {next_state, node, State#state{ 
                recipients = length(Recipients0), 
                children = [Child1, Child2], 
                median = Median
            }}
    end.


leaf(get_count, _From, State=#state{recipients=Recipients}) ->
    {reply, length(Recipients), leaf, State};

leaf(trace, _From, State=#state{recipients=Recipients}) ->
    {reply, length(Recipients), leaf, State};
    
leaf(shutdown, _From, State=#state{recipients=Recipients}) ->
    {stop, normal, Recipients, State};
    
leaf({remove_recipient, Pid, _}, From, State=#state{recipients=Recipients}) ->
    {reply, ok, leaf, State#state{ recipients = lists:keydelete(Pid, #recipient.ws_pid, Recipients) }}.




node({post, Discriminant, Token}, State=#state{children=Children, median=Median}) ->
    post(?SELECT_CHILD(Children, Median, Discriminant), Discriminant, Token),
    {next_state, node, State};

node(Recipient=#recipient{discriminant=Discriminant}, 
     State=#state{recipients=RecipientCount, children=Children, median=Median}) ->
    new_recipient(?SELECT_CHILD(Children, Median, Discriminant), Recipient),
    {next_state, node, State#state{ recipients = RecipientCount+1 }}.


node(get_count, _From, State=#state{recipients=RecipientCount}) ->
    {reply, length(RecipientCount), node, State};

node(trace, _From, State=#state{children=Children=[Child1, Child2], median=Median}) ->
    SubTree = lists:foldr(fun(Child, Acc) ->
        [ {Child, trace(Child)} | Acc ]
    end, [], Children),
    {reply, {Median, SubTree}, node, State};

node({remove_recipient, Pid, Discriminant}, _From,
     State=#state{recipients=RecipientCount, children=Children, median=Median}) ->
         
    remove_recipient(?SELECT_CHILD(Children, Median, Discriminant), Pid, Discriminant),
    if
        RecipientCount == ?MAX_MEMBERS ->
            % io:format("Recipients count low enough, shrinking tree~n"),
            Recipients = lists:foldl(fun
                (Child, Acc) ->
                    unlink(Child),
                    lists:keymerge(#recipient.discriminant, Acc, gen_fsm:sync_send_event(Child, shutdown))
            end, [], Children),
            
            % io:format("[~w] 3~n~n", [self()]),
            {reply, ok, leaf, State#state{ recipients = Recipients, median = undefined, children = [] }};
            
        true ->
            {reply, ok, node, State#state{ recipients = RecipientCount-1 }}
    end.



handle_event(_Event, StateName, State) ->
    {next_state, StateName, State}.

handle_sync_event(_Event, _From, StateName, State) ->
    {reply, unexpected, StateName, State}.

handle_info({'EXIT', From, Reason}, leaf, State=#state{recipients=Recipients}) ->
    case lists:keymember(From, #recipient.ws_pid, Recipients) of
        true ->
            {next_state, leaf, State#state{recipients=lists:keydelete(From, #recipient.ws_pid, Recipients)}};
        false ->
            {stop, Reason, State}
    end;

handle_info({'EXIT', Child, Reason}, node, State=#state{children=[Child, OtherChild]}) ->
    { ok, NewChild } = reactiv_router_sup:start_router(),
    link(NewChild),
    RecipientCount = get_count(OtherChild),
    ok = gen_fsm:sync_send_event(NewChild, {recipients, []}),
    {next_state, node, State#state{recipients=RecipientCount, children=[NewChild, OtherChild]}};

handle_info({'EXIT', Child, Reason}, node, State=#state{children=[OtherChild, Child]}) ->
    { ok, NewChild } = reactiv_router_sup:start_router(),
    link(NewChild),
    RecipientCount = get_count(OtherChild),
    ok = gen_fsm:sync_send_event(NewChild, {recipients, []}),
    {next_state, node, State#state{recipients=RecipientCount, children=[OtherChild, NewChild]}};

handle_info({'EXIT', _From, Reason}, node, State=#state{children=[Child1, Child2]}) ->
    {stop, Reason, State}.

terminate(_Reason, _StateName, _State) ->
    ok.

code_change(_OldVsn, StateName, State, _Extra) ->
    {ok, StateName, State}.
