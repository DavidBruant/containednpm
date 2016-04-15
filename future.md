# Future

The blogpost and this repo haven't moved any lines. Nobody at npm cares enough to explore this direction, so lifecycle contained (docker or something else) by default won't happen anytime soon.

It seems that the threat npm is interested in is malicious packages being distributed via npm.
The threat I care about is my machine being infected by such a package when one slips through.

This work will remain an opt-in for the time being.


## Towards dogfooding

This work is worthless is used by no one. I'll use it myself and do anything reasonable for others to be able to use it as well

### Common

* Put the contained versions somewhere
* Add this somewhere to the `$PATH`
* Make that `node` points to the contained version and `unsafe-node` to the uncontained version. Same for `npm`.
* Make the Docker image use the host `node`/`npm` executables (let's try as :ro) so that there are always in sync; no need to upgrade the docker image.
* Make the docker image and publish it to the docker hub
* Make that created files are chown'ed by the current user and not `root` (there might be a uid trick of some kind)

### npm

Pretty much done. Remaining:

* .npm
* .npmrc


### node 

Need some way to provide additional caps (certainly via docker-compose + extends. Need to figure out how in a way that's maintainable)





