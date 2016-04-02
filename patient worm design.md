# Patient npm worm design

This worm does not attempt at spreading as quickly as possible; it just waits until the user performs an `npm publish`.

It rewrites what happens when people do `npm publish`. In a machine infecting with the worm, doing `npm publish` actually does the following:
1. Modify `package.json` to add a `postinstall` script (or `postpostinstall`, etc. whatever doesn't exist yet but runs after all other lifecycle scripts) to add code that installs itself silently
2. Perform the actual publishing
3. Modify `package.json` back to its original value so the author doesn't notice the difference on their machine.

At this point, the module author does not see a difference, but the published version on npm in infected. The worm can be noticed if people install the package and look at `package.json` inside the package in `node_modules`... but who does that?

Among other things, this worm is also more efficient because it does not need to scan anything

This worm won't trigger any alarm on npm side because the rate of publishing is exactly the same as without the worm.
The worm installs itself silently on the host machine, so they won't notice it. It also acts only when something is published which is rare enough to be unnoticeable for a long time. In fact, we may all already be affected by such a worm without knowing it!