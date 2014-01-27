#
# Cookbook Name:: tests
# Recipe:: default
#
# Copyright (C) 2014 YOUR_NAME
# 
# All rights reserved - Do Not Redistribute
#

# curl -L -s http://www.erlang.org/download/otp_src_R15B03-1.tar.gz | shasum -a 256

# checksums = {
#   "R16B03" => '6133b3410681a5c934e54c76eee1825f96dead8d6a12c31a64f6e160daf0bb06',
#   "R15B03-1" => "4bccac86dd76aec050252e44276a0283a0df9218e6470cf042a9b9f9dfc9476c",
#   "R14B04" => "099b35910e635b9148ac90f70fd9dd592920ed02406eb26c349efd8d1e959b6e",
#   "R13B04" => "e2694383b3857f5edfc242b8c3acbfba4683e448387fa124d8e587cba234af43"
# }
# 
# default['tests']['erlang_version'] = "R15B03"
# 
# override['erlang']['install_method'] = 'erl'
# override['erlang']['source'] = {
#   'version' => node['tests']['erlang_version'],
#   'url' => "http://www.erlang.org/download/otp_src_#{node['tests']['erlang_version']}.tar.gz",
#   'checksum' => checksums[node['tests']['erlang_version']]
# }

override['erlang']['install_method'] = 'esl'