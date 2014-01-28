# Found at http://serverfault.com/a/554862/102035

ruby_block "edit /etc/sysctl.conf" do
  _file = "/etc/sysctl.conf"
  _comment = "# TWEAK BY CHEF"
  _content = "fs.file-max = 512000"
  block do
    file = Chef::Util::FileEdit.new(_file)
    file.insert_line_if_no_match(/#{Regexp.escape(_comment)}/, "#{_comment}\n#{_content}")
    file.write_file
  end
  not_if "cat #{_file} | grep '#{_comment}'"
  notifies :run, "execute[sysctl -p]", :immediately
end

execute "sysctl -p" do
  command "sysctl -p"
  # returns 255 # which would normally signify error, but doesn't on sysctl on CentOS
  action :nothing
end

ruby_block "edit /etc/security/limits.conf" do
  _file = "/etc/security/limits.conf"
  _comment = "# TWEAK BY CHEF"
  _content = "* - nofile 65535"
  block do
    file = Chef::Util::FileEdit.new(_file)
    file.insert_line_if_no_match(/#{Regexp.escape(_comment)}/, "#{_comment}\n#{_content}")
    file.write_file
  end
  not_if "cat #{_file} | grep '#{_comment}'"
end