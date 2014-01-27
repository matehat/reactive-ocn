# Reactive OCN

Application web démo pour opencode.ca - 2/14

Trois branches sont actives pour ce project: 

  - [`chef`](http://github.com/matehat/reactive-ocn), la branche par défaut, contient ce qu'il faut pour rouler le tout comme un chef!
  - [`gh-pages`](http://github.com/matehat/reactive-ocn/tree/gh-pages) contient la page web public accessible depuis http://bit.ly/reactive-ocn
  - [`erlang`](http://github.com/matehat/reactive-ocn/tree/erlang) contient la version Erlang du serveur
  - [`node`](http://github.com/matehat/reactive-ocn/tree/node) contient la version Node.js
  
## Rouler le tout!

* Clonez le présent dépôt
* Ayez [Vagrant][1] et [VirtualBox][2] installé
* `bundle install`
* `berks install`
* `vagrant up [erlang | node]` pour rouler le serveur que vous voulez. Omettez l'option pour démarrer les deux.

[1]: http://vagrantup.com
[2]: http://virtualbox.org
