# Contained-node

There is an [npm worm vulnerability](https://www.kb.cert.org/vuls/id/319816). One of the main problems is that random scripts are run with full user privilege.

This repo provides a proof that secure user-contributed scripts is possible. It's a POC and does not pretend that the used implementation is shippable as is. Additional work would be required for this idea to be integrated to the official npm CLI client.


## How it works

Run node and npm both from [Docker](https://www.docker.com/) containers with reduced authority by default.


## Setup

A bunch of things to install before the POC work

* **Install** [Docker](https://docs.docker.com/installation/#installation)
  * On Ubuntu, there is an [apt repository](https://docs.docker.com/engine/installation/ubuntulinux/)
    * (for steps 5 to 7, do `echo "deb https://apt.dockerproject.org/repo ubuntu-trusty main" > /etc/apt/sources.list.d/docker.list`)  

* **Install** [Docker compose](https://docs.docker.com/compose/install/)

````sh
git clone git@github.com:DavidBruant/contained-node.git
cd contained-node

# change the PATH only for this shell session
PATH=$PWD/bin:$PATH

# Install nsenter and docker-enter from https://github.com/jpetazzo/nsenter by doing: 
docker run --rm -v /usr/local/bin:/target jpetazzo/nsenter

````



## Defense POC

````sh
cd project-alpha
cat package.json
npm install https://github.com/DavidBruant/harmless-worm --save
cat package.json
# Notice that package.json has been modified by a lifecycle script :-(

# reset to non infected state
cd .. 
git checkout project-alpha

# Build the dindnode image (it's a long step because node is compiled)
docker build -t dindnode .

docker-compose -f contained-services.yml run -d --name containednode containednode
docker exec containednode docker pull mhart/alpine-node:5

./bin/containednpm -v # running npm via the container

cd project-alpha
ls -l node_modules
# there are no modules

../bin/containednpm install is-thirteen --save
# Does the expected, works fine
../bin/containednpm install https://github.com/DavidBruant/harmless-worm/tarball/master --save
# the worm postinstall fails

ls -l node_modules
# the worm and is-thirteen are installed in the project-alpha/node_modules
cat package.json
# worm is in dependencies as expected, BUT the worm has NOT infected the file
rm -R node_modules


cd ../project-beta
./bin/containednpm install https://github.com/DavidBruant/harmless-worm --save
# the worm fails again

ls -l node_modules
# the worm is installed on beta
cat package.json
# worm is in dependencies as expected
rm -R node_modules

````

The main reason the worm fails is that it does not have authority it does not need to
The worm can modify package.json anyway and wait for us to publish

Feel free to try to install [rimrafall](https://github.com/joaojeronimo/rimrafall); it will delete all the files in the container... which none of them you care about (except the `project-alpha` files).


## Limitations and room for improvements

There are plenty of either, but that's not the point. The point was to demonstrate that secure and useful user-contributed code is possible, not to promote this specific implementation.



## Inspirations and credit

Lots of inspirations for this work. But these may be the main ones

* [Polaris](http://www.hpl.hp.com/techreports/2004/HPL-2004-221.html)
* [Virus Safe Computing Initiative](https://www.youtube.com/watch?v=pMhH6IKBrVo)
* [Docker Containers on the Desktop](https://blog.jessfraz.com/post/docker-containers-on-the-desktop/)


# TODO

Talk about the other threat
* https://medium.freecodecamp.com/npm-package-hijacking-from-the-hijackers-perspective-af0c48ab9922#.evm0u6h95
* https://github.com/joaojeronimo/rimrafall
