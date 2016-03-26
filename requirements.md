# Seamless and transparent replacement

## Solution

Use `npm` and `node` as aliases to the dockerized version


# Make sure that the /bin in node projects use the sandboxed version

Maybe aliases aren't enough and `node` and `npm` need to be somewhere where the `$PATH` can find them


# Update

A new version of node/npm comes out
Need an update software that checks/downloads the newer docker images


# postinstall scripts that build something

Requires write-authority on current directory (`$PWD`) to create subdirectories/files


# npm needs access to the network to fetch packages

Only on npm domains (cdns, etc.) to begin with
npm can retrieve packages by URL, so let's not limit anything here for now


# Node does not need access to the network by default

`network_mode: "none"`


# Provide additional permissions

Sometimes, a node program needs more authority than the default. Need to specify this additional authority.
This can be done via an additional docker-compose file that uses [`extends`](https://docs.docker.com/compose/compose-file/#extends)


# Global script



# Different versions of node

## Solution

Maybe use nvm inside the container?
Maybe environment variable like `NODE_VERSION`



# npm publish

provide a `loggednpm` command

