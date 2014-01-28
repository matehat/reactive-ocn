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
* Puis

```bash
$ bundle install
$ berks install
$ vagrant plugin install vagrant-omnibus
$ vagrant plugin install vagrant-berkshelf
$ vagrant up [erlang | node] # pour rouler le serveur que vous voulez. Omettez l'option pour démarrer les deux.
```

### Volume de code

```
• ~/development/opencode [git:chef+] → cloc node/{src,lib} erlang/src
      17 text files.
      17 unique files.                              
       1 file ignored.

http://cloc.sourceforge.net v 1.58  T=0.5 s (32.0 files/s, 1876.0 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
Erlang                           8            155             33            300
Javascript                       4             33              0            248
CoffeeScript                     4             37              0            132
-------------------------------------------------------------------------------
SUM:                            16            225             33            680
-------------------------------------------------------------------------------
```

[1]: http://vagrantup.com
[2]: http://virtualbox.org
