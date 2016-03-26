# Contained

Aim is to eventually run everything as Docker containers.
Let's start with Node.

```
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


````
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


````
david@ZIENA:~/projects/wikidata-pokemon (master)$ docker run -v .:. node:4.2 node index.js
docker: Error response from daemon: Invalid bind mount spec ".:.": volumeabs: Invalid volume destination path: '.' mount path must be absolute..
See 'docker run --help'.

david@ZIENA:~/projects/wikidata-pokemon (master)$ docker run -v $PWD:/usr/app node:4.2 node /usr/app/index.js
Got error: getaddrinfo ENOTFOUND wdq.wmflabs.org wdq.wmflabs.org:80
david@ZIENA:~/projects/wikidata-pokemon (master)$ node index.js
Got error: getaddrinfo ENOTFOUND wdq.wmflabs.org wdq.wmflabs.org:80
````

Take a good 20-30sec perf hit (for no reason?)

````
david@ZIENA:~/projects/wikidata-pokemon (master)$ docker run -i node:4.2 node < index.js
module.js:339
    throw err;
    ^

Error: Cannot find module 'wikidata-sdk'
````

Passing things as stdin from host works. Interesting idea. Of course dependent modules are not available


# Conclusion

```
docker run -v $(pwd):/usr/app:ro -w /usr/app node:4.2 node index.js

alias donode='docker run -v $PWD:/usr/app:ro -w /usr/app node:4.2 node'
alias donpm='docker run -v $PWD:/usr/app:ro -w /usr/app node:4.2 npm'
```


