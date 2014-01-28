include_recipe 'runit'
include_recipe 'nodejs'
include_recipe 'ocn::fileno'

bash "npm install" do
  user "root"
  cwd "/vagrant/node"
  code "npm install"
  not_if { ::File.exists?("/vagrant/node/node_modules")}
end

runit_service "reactive_ocn_node" do
  template_name "nodejs"
  log false
  check false
  finish false
end