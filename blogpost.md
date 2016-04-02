# Defeating the npm worm (DRAFT)

## The threat

There is a security vulnerability in [npm](https://www.npmjs.com/) by default that enables writing a [worm](https://en.wikipedia.org/wiki/Computer_worm) that can propagate to anyone doing an `npm install` to a package that would contain an infected dependency (even if the dependency is deep).

More: [1](https://www.kb.cert.org/vuls/id/319816) [2](http://www.infoq.com/news/2016/03/npm-infection)

This threat uses a combinaison of elements:

1. `npm install` installs a package and all its dependencies (and deeply) by default
2. `npm install --save` makes that by default, dependency versions accept any later [patch version](http://semver.org/#summary) of the same package
3. `npm install`, by default, runs all [lifecycle scripts](https://docs.npmjs.com/misc/scripts#description) of all dependencies and these can be arbitrary bash commands
4. `npm login`, by default, saves the authentication credentials in `$HOME/.npmrc`.
5. By default, published packages are actually published without review
6. Arbitrary npm lifecycle scripts bash commands have, by default, full authority over the installer computer. This includes scanning the person's hardrive, find all their node projects, modify them to add worm propagation code as a lifecycle script and then run `npm version patch ; npm publish`.

Through the annoying and repeated use of "by default", the reader understands that if a worm is sent to npm, it will propagate because most people don't change defaults. Point 5 listed an example of what the worm can do to propagate, but of course once you have arbitrary access to the machine, you can just encrypt their disk and ransom for a bitcoin against giving back the data.

This is serious.


## NPM response and defense against a worm

[NPM response](http://blog.npmjs.org/post/141702881055/package-install-scripts-vulnerability) has been considered weak by some. It is. It does not change any default settings, so the threat is not really being addressed.

### Users should opt-in for security

npm recommands an opt-in defense which is running `npm install --ignore-scripts` which disables lifecycle scripts. [It is suggested elsewhere](https://www.kb.cert.org/vuls/id/319816) to do `npm shrinkwrap` to lock down dependencies or to log out systematically after having published. These are also an opt-in.


### Crowdsourced package inspection

> npm cannot guarantee that packages available on the registry are safe. If you see malicious code on the registry, report it to support@npmjs.com and it will be taken down.

So, after the fact, when users machine have been infected by a worm npm takes the malicious package down? Too late, but thanks, lol!


### Defense against a "quick" worm

> npm monitors publish frequency. A spreading worm would set off alarms within npm, and if a spreading worm were identified we could halt all publishing while infected packages were identified and taken down.

What about a [patient worm](patient worm design.md)? The publication frequency is exactly the same as the normal frequency and discrecy makes it hard to detect on users machines as well as hard to detect which packages are infected on npm. You can start playing the [virus signature game](https://en.wikipedia.org/wiki/Computer_virus#Self-modification) but attack is always a step ahead of defense in this game and it'd be a massive amount of resources spent only on this problem. Blaaah...


## Security **by default**

Software should be secure by default.

People who are coming to npm today and tomorrow have missed the blogposts and tweets. They'll be infected.

People who reinstall node/npm will forget the secure opt-ins. They will be infected.

I am sorry, but the current insecure-by-default state of npm is irresponsible. Some default needs to be changed.


### But which default should be changed? 

Let's review the list above:

1. Sort of the very point of `npm install`, let's keep this default.
2. Accepting patches. Hey, super useful when a module has a security patch! Removing this default pretty much means choosing a threat against another. This default remains.
3. [It's been suggested that removing lifecycle scripts would help security](https://twitter.com/feross/status/713602268403081216). Sure it does, but then you have to run the lifecycle scripts manually. Oh! and by the way, you're infected by a worm if you don't review all of them! This default remains, because the problem is not here and it's useful anyway.
4. Removing this default means logging in every time. Arguably a Denial-Of-Service attack against the user ([credit for the joke](https://youtu.be/UH66YrzT-_M?t=347)). There is no reason to give up usability for the sake of security.
5. This one can be debated. Complicated topic. I'm on the side of keeping things as they are today. It's like the web. Anyone can publish, no authorizations required.
6. well... last element in the list, so I guess that's the default I should address :-p

People I don't necessarily trust a lot write scripts, post them as lifecycle scripts on npm and that runs on my machine. Why on Earth would these scripts have access to my entire filesystem, by default? This is an insane amount of authority to give to random scripts downloaded from npm, who themselves tell us they "cannot guarantee that packages available on the registry are safe".


#### Aside on capability security 

Like the joke above, I'm only parroting the words of others here.
* https://youtu.be/UH66YrzT-_M?t=227
* https://www.youtube.com/watch?v=eL5o4PFuxTY
* https://www.youtube.com/watch?v=vrbmMPlCp3U

(these talks are long, but there're worth your time, I promise. I have others if you're interested)

The folks in these videos have good metaphors for the state of software security. One of my [favorite quote comes from Marc Stiegler](https://youtu.be/eL5o4PFuxTY?t=3913):

> Buffy Summers! In Season 3, her mother makes the criticism that every security person needs to pay attention to! Joyce says to Buffy: "but what's your plan? you go out every day, you kill a bunch of bad guys and then the next day there is more bad guys. You can't win this way. You need a plan."
And finally Buffy in the last episode of the last season comes up with a plan: she changes the fundamental laws of physics of the Universe to permanently favor the defender.
> 
> What could be lazier than forcing the other guy to play by your rules?

Why are we running commands that, by default, have the authority to publish npm packages on our behalf? We're playing the attacker game. Any npm command and lifecycle script should only have the authority to do its job and no more.

But how?


## Secure-by-default lifecycle scripts

The first step is defining the appropriate amount of authority that lifecycle scripts should have.
What are legitimate usages of lifecycle scripts? We can start with the following list:
* build things (like compile coffeescript scripts or compile some C++ to make a C++ Node module) and put it *somewhere in the project directory*

(yes there is a single item, let's have a discussion on what that list should be)

So the lifecycle script needs read-write authority over the project directory. Cool! Let's give it **only** access to this specific directory and no other!
...wait! Why does it have write authority over `package.json`? Never heard of a build script that needs to modify `package.json`, let's only give read-only authority over this file and read-write over the rest.


### Proof-of-concept of a how

I have a proof of concepts of this. It uses [Docker](https://docs.docker.com/) because it was easy for me to write. Smarter people with more time on their hand will find more sublte solutions.

In the end, what happens is that if you run `npm install https://github.com/DavidBruant/harmless-worm/tarball/master --save`, what happens is:
* npm download the dependency
* it is saved under `node_modules`
* the `postscript` script runs and modifies `package.json` in a scary way
* npm modifies `package.json` to add `worm` in the `dependencies` field

But when you run `./bin/containednpm install https://github.com/DavidBruant/harmless-worm/tarball/master --save`, what happens is:
* (same)
* (same)
* the `postscript` fails to edit `package.json` because it only has access to a read-only version
It would also fail to read your `$HOME` because it runs in a docker container and nobody gave access your `$HOME` to this container
* (same)

The lifecycle encrypts the filesystem and want to ransom for a bitcoin? It succeeds... inside the docker container which contains few valuable data (only the project you're working on)... container that is discarded at the end of the `./bin/containednpm` command, so you're data are fine without having you to pay.

That's the way we can change the rules of the game permanently in favor of the defendant.




