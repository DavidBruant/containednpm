# Containednpm

There is an [npm worm vulnerability](https://www.kb.cert.org/vuls/id/319816). One of the main problems is that random scripts are run with full user privilege.

This repo provides a proof that secure user-contributed scripts is possible. It's a POC and does not pretend that the used implementation is shippable as is. Additional work would be required for this idea to be integrated to the official npm CLI client.


## How it works

The shell used as [`script-shell`](https://docs.npmjs.com/misc/config#script-shell) is a `docker run` call that is passed enough authority to work properly, but not enough to do anything seriously harmful.


## Setup

A bunch of things to install before the POC work

* **Install** [Docker](https://docs.docker.com/install/)
* **Install** [Docker compose](https://docs.docker.com/compose/install/)

````sh
git clone git@github.com:DavidBruant/containednpm.git
cd containednpm

# (optional but recommanded) builds the image a first time and make sure it runs properly
docker-compose -f contained-services.yml run contained_npm_script echo 'success'

npm config set script-shell "$PWD"/bin/contained-run-script-sh
````


## Defense POC

:warning: **This only works on Linux for now. It's certainly possible to have it work on Windows and Mac, but that's for another day**


````sh
## Step 1 : Arbitrary code execution with user privilege

npm config delete script-shell

cd project-alpha
cat package.json
npm install https://github.com/DavidBruant/harmless-worm --save
cat package.json
# Notice that package.json has been modified by a lifecycle script :-(

# reset to non infected state
cd .. 
git checkout project-alpha

npm config set script-shell "$PWD"/bin/contained-run-script-sh

cd project-alpha
ls -l node_modules
# there are no modules


## Step 2 : Arbitrary code execution within some docker container

npm install is-thirteen --save
# Does the expected, works fine
npm install https://github.com/DavidBruant/harmless-worm --save
# the worm postinstall fails! \o/

ls -l node_modules
# the worm and is-thirteen are installed in the project-alpha/node_modules
cat package.json
# worm is in dependencies as expected, BUT the worm has NOT infected the file
rm -R node_modules


## Step 3 : Arbitrary code execution within some docker container for some other project

cd ../project-beta
./bin/containednpm install https://github.com/DavidBruant/harmless-worm --save
# the worm fails again! \o/

ls -l node_modules
# the worm is installed on beta
cat package.json
# worm is in dependencies as expected
rm -R node_modules
````

The main reason the worm fails is that it does not have authority it should not have in the first place
The worm can modify package.json anyway and wait for us to publish

Feel free to try to install [rimrafall](https://github.com/joaojeronimo/rimrafall); it will delete all the files in the container... which you don't really care about (except the `project-alpha` files).


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
