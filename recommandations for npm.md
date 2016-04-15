# Recommandations for npm

## Run lifecycle scripts with lower authority by default

This defense POC is based on the assumption that scripts are run via `sh -c` [citation needed]. Here, we replace `sh` by a version that runs inside a Docker container with lower privileges than the one provided by `sh` running on the host machine (specifically, the contained lifecycle scripts only have read-only access to `package.json`)

One idea would be to provide a config option `lifecycle-script-sh` that would have a default value to something safe (like the docker container in the defense POC). Getting off of this default value is as easy as `npm config set lifecycle-script-sh sh`.
You may also provide an option to npm like `npm install something --unsafe-lifecycle` so this commands uses `sh` for lifecycle scripts. But at least, people made a deliberate choice and accept the potential consequences.


## Store auth credentials somewhere else that .npmrc

Docker granularity of capability is the file. It would be possible to copy .npmrc but the `_auth` field, but it's wasteful. In any case .npmrc is something that people may want to version/share. In that context `_auth` is a bit wasteful


## package.json readable from the website

So it's more easily audited for malicious lifecycle scripts