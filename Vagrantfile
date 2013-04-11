# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  # All Vagrant configuration is done here. The most common configuration
  # options are documented and commented below. For a complete reference,
  # please see the online documentation at vagrantup.com.

  config.vm.box = "precise32"
  
  config.vm.provision :chef_solo do |chef|
    chef.add_recipe("build-essential")
    chef.add_recipe("apt")
    chef.add_recipe("nodejs")
  end

end
