# Contained-node

Everyone is über-worried about the [npm worm](https://www.kb.cert.org/vuls/id/319816).

The best solution so far is [feature starvation (disable lifecycle scripts)](http://blog.npmjs.org/post/141702881055/package-install-scripts-vulnerability) for users and manual inspection from npm to prevent a problem.

This repo attempts to provide a pragmatic solution to this entire class of problems by containing node and npm in docker containers.


# How it works

Run node and npm both from [Docker](https://www.docker.com/) containers with reduced authority by default.

You'll need to have both docker and docker-compose installed for this to work.


# This is a proof of concept

Plenty of paths are hardcoded

## Proving that it works

There is a [worm POC called "pizza-party"](https://github.com/contolini/pizza-party), let's see if we can install it safely.

````sh
git clone git@github.com:DavidBruant/contained-node.git
cd contained-node
bin/node -v # should download the docker images if you don't have them yet
# v5.9.0
bin/npm -v
# 3.7.3
bin/node index.js
# should display "hey, this is index.js!", proving that the container can reach through local filesin $PWD
bin/npm install is-thirteen
# the modules installs normally and node_modules is created
npm whoami # real non-dockerized npm
# davidbruant
bin/npm whoami
# Obviously:
# npm ERR! need auth this command requires you to be logged in.
# npm ERR! need auth You need to authorize this machine using `npm adduser`

# so consequently:
bin/npm install https://github.com/contolini/pizza-party
# the worm gets installed via the dockerized npm
# the install script starts, it does not publish a new version, because we're not logged in

# VICTORY!!

bin/loggednpm whoami
# davidbruant
# this way, you can still publish ;-)
````

Strangely, I would have assumed the `npm version patch` part and the part where `script.install` gets rewritten work, but it doesn't for some reason. In any case, the worm would not work because the dockerized version of npm is not logged in.






# Inspirations

* [Polaris](http://www.hpl.hp.com/techreports/2004/HPL-2004-221.html)
* [Virus Safe Computing Initiative](https://www.youtube.com/watch?v=pMhH6IKBrVo)
* [Docker Containers on the Desktop](https://blog.jessfraz.com/post/docker-containers-on-the-desktop/)