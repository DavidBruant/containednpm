#!/usr/bin/env node

const { spawnSync } = require('child_process');
const { relative, join } = require('path');

const cwd = process.cwd();

const hostProjectRoot = process.env.INIT_CWD; // TODO maybe throw an `npm prefix` in addition
const guestProjectRoot = '/home/node-app'

const GUEST_CWD = join(guestProjectRoot, relative(hostProjectRoot, cwd))

console.log(cwd)
console.log(hostProjectRoot)
console.log(guestProjectRoot)
console.log(relative(hostProjectRoot, cwd))
console.log(GUEST_CWD)

// TODO : if process.argv.slice(2)[1].trim().startsWith('npm '), then execute the command without docker-compose

spawnSync(
    'docker-compose', 
    [
        '-f', '/home/david/projects/containednpm/contained-services.yml', 
        'run', 'contained_npm_script', 
        'sh'
    ].concat(process.argv.slice(2)),
    {
        stdio: 'inherit',
        env: Object.assign(
            {},
            process.env, // way too many things here. TODO : clean that up
            {
                GUEST_CWD,
                HOST_CWD: cwd
            }
        )
    }
)
