include_recipe 'erlang'
include_recipe 'runit'
include_recipe 'git'
include_recipe 'build-essential'
include_recipe 'ocn::fileno'

bash "Prepare erlang project" do
  user "vagrant"
  cwd "/vagrant/erlang"
  code "./rebar clean get-deps compile generate"
  not_if { ::File.exists?("/vagrant/erlang/rel/reactiv_1_0")}
end

runit_service "reactive_ocn_erlang" do
  template_name "erlang"
  log false
  check false
  finish false
end