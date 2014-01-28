include_recipe 'runit'
include_recipe 'nodejs'
include_recipe 'ocn::fileno'

runit_service "reactive_ocn_node" do
  template_name "nodejs"
end