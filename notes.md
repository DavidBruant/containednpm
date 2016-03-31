# Contained

Aim is to eventually run everything as Docker containers.
Let's start with Node.

```sh
david@ZIENA:~ $ docker run node:4.2 node -e "console.log('lol')"
lol
david@ZIENA:~ $ time docker run node:4.2 node -e "console.log('lol')"
lol

real	0m1.378s
user	0m0.084s
sys	0m0.028s
david@ZIENA:~ $ time docker run node:4.2 node -e "console.log('lol')"
lol

real	0m1.314s
user	0m0.096s
sys	0m0.016s
david@ZIENA:~ $ time node -e "console.log('lol')"
lol

real	0m0.124s
user	0m0.104s
sys	0m0.020s
david@ZIENA:~ $ time node -e "console.log('lol')"
lol

real	0m0.125s
user	0m0.108s
sys	0m0.020s
```

Take a 1s latency hit :-/


````sh
david@ZIENA:~/projects/wikidata-pokemon (master)$ node index.js 
Got error: getaddrinfo ENOTFOUND wdq.wmflabs.org wdq.wmflabs.org:80
david@ZIENA:~/projects/wikidata-pokemon (master)$ docker run node:4.2 node index.js
module.js:339
    throw err;
    ^

Error: Cannot find module '/index.js'
    at Function.Module._resolveFilename (module.js:337:15)
    at Function.Module._load (module.js:287:25)
    at Function.Module.runMain (module.js:467:10)
    at startup (node.js:134:18)
    at node.js:961:3
````

Error is expected, container has no knowledge of this file. How to provide it?


````sh
david@ZIENA:~/projects/wikidata-pokemon (master)$ docker run -v .:. node:4.2 node index.js
docker: Error response from daemon: Invalid bind mount spec ".:.": volumeabs: Invalid volume destination path: '.' mount path must be absolute..
See 'docker run --help'.

david@ZIENA:~/projects/wikidata-pokemon (master)$ docker run -v $PWD:/usr/app node:4.2 node /usr/app/index.js
Got error: getaddrinfo ENOTFOUND wdq.wmflabs.org wdq.wmflabs.org:80
david@ZIENA:~/projects/wikidata-pokemon (master)$ node index.js
Got error: getaddrinfo ENOTFOUND wdq.wmflabs.org wdq.wmflabs.org:80
````

Take a good 20-30sec perf hit (for no reason?)

````sh
david@ZIENA:~/projects/wikidata-pokemon (master)$ docker run -i node:4.2 node < index.js
module.js:339
    throw err;
    ^

Error: Cannot find module 'wikidata-sdk'
````

Passing things as stdin from host works. Interesting idea. Of course dependent modules are not available



```sh
docker run -v $(pwd):/usr/app:ro -w /usr/app node:4.2 node index.js

alias donode='docker run -v $PWD:/usr/app:ro -w /usr/app node:4.2 node'
alias donpm='docker run -v $PWD:/usr/app:ro -w /usr/app node:4.2 npm'
```


# https://github.com/DavidBruant/contained-node/issues/1#issuecomment-202127043

## docker in docker

````sh
docker run --privileged --name test-dind -d docker:1.10.3-dind

docker exec test-dind docker ps
# CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
docker ps
# CONTAINER ID        IMAGE                COMMAND                  CREATED             STATUS              PORTS               NAMES
# 26c7a2a4a022        docker:1.10.3-dind   "dockerd-entrypoint.s"   7 minutes ago       Up 7 minutes        2375/tcp            test-dind


docker exec test-dind docker pull node:4
# doesn't do the magic arrow thing, but who cares...
# Super super long. Seems like it's doing a lot of file I/O (more than a regular docker pull)

docker exec test-dind docker run node:4 node -v
# v4.4.0
time docker exec test-dind docker run node:4 node -v
# v4.4.0
# real	1m23.815s ... what?


docker exec test-dind docker pull mhart/alpine-node:5

docker exec test-dind docker run mhart/alpine-node:5 node -v
# v5.9.1
time docker exec test-dind docker run mhart/alpine-node:5 node -v
# v5.9.1
# Between 2 and 5secs
````

As a docker-compose service (need to make a docker image eventually):
````sh
docker-compose -f contained-services.yml run -d --name test-dind dind
docker exec test-dind docker pull mhart/alpine-node:5

# docker kill test-dind ; docker rm --force test-dind
````



:rw then :ro
````sh
cat ./victim.txt 
# I am safe

# Inside the first container, the file is passed as read-write

docker exec test-dind ls -l /home
# total 4
# -rw-rw-r--    1 1000     1000             9 Mar 28 12:24 victim.txt

docker exec test-dind sh -c "echo "yo" >> /home/victim.txt"
docker exec test-dind sh -c "cat /home/victim.txt"
# I am safeyo
# File could be modified

docker exec test-dind docker pull alpine:latest
docker exec test-dind docker run -v /home/victim.txt:/home/victim.txt:ro alpine sh -c "cat /home/victim.txt"
# I am safeyo
# file can be read in deeper container

docker exec test-dind docker run -v /home/victim.txt:/home/victim.txt:ro alpine sh -c "echo ya >> /home/victim.txt"
# sh: can't create /home/victim.txt: Read-only file system
# file cannot be written as expected (:ro)

echo "new message" > victim.txt
docker exec test-dind docker run -v /home/victim.txt:/home/victim.txt:ro alpine sh -c "cat /home/victim.txt"
# new message
# (changes to base file are seen by deepest container)

````

## Attaching volumes dynamically

````sh
# Install nsenter and docker-enter https://github.com/jpetazzo/nsenter
docker run --rm -v /usr/local/bin:/target jpetazzo/nsenter

docker-compose -f contained-services.yml run -d --name test-dind dind

# Let's read /homenode-app/package.json (this file does not exist)
docker exec test-dind cat /home/node-app/package.json | grep name
# cat: can't open '/home/node-app/package.json': No such file or directory

# Dynamic volume swap
./dynamic-volume.sh

# Let's try again
docker exec test-dind cat /home/node-app/package.json | grep name
# "name": "alpha",

# oh... it works!
````


### dynamic volumes + dind

````sh
# Install nsenter and docker-enter https://github.com/jpetazzo/nsenter

docker-compose -f contained-services.yml run -d --name test-dind dind
docker exec test-dind docker pull alpine:latest

# Let's read /homenode-app/package.json (this file does not exist)
docker exec test-dind docker run -v /home/node-app:/home/node-app:ro alpine:latest cat /home/node-app/package.json | grep name
# cat: can't open '/home/node-app/package.json': No such file or directory

# Dynamic volume swap
./dynamic-volume.sh

# Let's try again
docker exec test-dind docker run -v /home/node-app:/home/node-app:ro alpine:latest cat /home/node-app/package.json | grep name
# "name": "alpha",

# oh... it works even in the deep case!
````


## Final boss

````sh
cd project-alpha
npm install ../worm
# get infected :-/

# reset to non infected state
cd .. 
git checkout project-alpha


docker-compose -f contained-services.yml run -d --name containednode containednode
./bin/node



````









