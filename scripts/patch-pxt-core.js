#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const packagePath = path.join(root, "node_modules", "pxt-core", "package.json");
const bundlePath = path.join(root, "node_modules", "pxt-core", "built", "web", "main.js");
const libraryPath = path.join(root, "node_modules", "pxt-core", "built", "pxtlib.js");
const webLibraryPath = path.join(root, "node_modules", "pxt-core", "built", "web", "pxtlib.js");
const webAppPath = path.join(root, "node_modules", "pxt-core", "built", "web", "pxtapp.js");
const expectedVersion = "13.1.5";

function fail(message) {
    throw new Error(message);
}

if (!fs.existsSync(packagePath) || !fs.existsSync(bundlePath)) {
    fail("pxt-core is not installed; run npm ci before applying local patches");
}

const installedVersion = JSON.parse(fs.readFileSync(packagePath, "utf8")).version;
if (installedVersion !== expectedVersion) {
    fail(`pxt-core ${installedVersion} is installed; patches require ${expectedVersion}`);
}

const patches = [
    {
        name: "await board-package editor reload before continuing",
        before: "await l.mainEditorPkg().addDependencyAsync(e,t,this.state.mode==g.Boards)&&this.props.parent.reloadHeaderAsync()",
        after: "await l.mainEditorPkg().addDependencyAsync(e,t,this.state.mode==g.Boards)&&await this.props.parent.reloadHeaderAsync()"
    },
    {
        name: "allow an early Monaco theme update before namespace loading",
        before: "getNamespaces(){const e=Object.keys(this.nsMap).filter(e=>!c.isBuiltin(e)",
        after: "getNamespaces(){const e=Object.keys(this.nsMap||{}).filter(e=>!c.isBuiltin(e)"
    },
    {
        name: "show bundled package display names in the hardware chooser",
        before: "c.map(e=>(0,r.jsx)(b,{name:e.name,description:e.description,imageUrl:e.icon,scr:e,onCardClick:this.addBundle",
        after: "c.map(e=>(0,r.jsx)(b,{name:e.displayName||e.name,description:e.description,imageUrl:e.icon,scr:e,onCardClick:this.addBundle"
    },
    {
        name: "keep static-package share links on the serving origin",
        before: 'r=(t?n.homeUrl:n.shareUrl)||"https://makecode.com/";',
        after: 'r=pxt.webConfig.isStatic?window.location.origin+"/":(t?n.homeUrl:n.shareUrl)||"https://makecode.com/";'
    }
];

let bundle = fs.readFileSync(bundlePath, "utf8");
let changed = false;
for (const patch of patches) {
    const beforeCount = bundle.split(patch.before).length - 1;
    const afterCount = bundle.split(patch.after).length - 1;
    if (beforeCount === 1 && afterCount === 0) {
        bundle = bundle.replace(patch.before, patch.after);
        changed = true;
    } else if (beforeCount !== 0 || afterCount !== 1) {
        fail(`cannot apply '${patch.name}': before=${beforeCount}, after=${afterCount}`);
    }
}

if (changed) fs.writeFileSync(bundlePath, bundle);

const libraryPatches = [
    {
        name: "use the serving origin API for static packages",
        filename: libraryPath,
        before: [
            'Cloud.apiRoot = (pxt.BrowserUtils.isLocalHost() || Util.isNodeJS) ? "https://www.makecode.com/api/" : "/api/";',
            'Cloud.apiRoot = ((pxt.BrowserUtils.isLocalHost() && !pxt.webConfig.isStatic) || Util.isNodeJS) ? "https://www.makecode.com/api/" : "/api/";'
        ],
        after: 'Cloud.apiRoot = ((pxt.BrowserUtils.isLocalHost() && !(typeof pxtConfig !== "undefined" && pxtConfig.isStatic)) || Util.isNodeJS) ? "https://www.makecode.com/api/" : "/api/";'
    },
    {
        name: "use the serving origin API for static web packages",
        filename: webLibraryPath,
        before: [
            't.apiRoot=e.BrowserUtils.isLocalHost()||n.isNodeJS?"https://www.makecode.com/api/":"/api/"',
            't.apiRoot=e.BrowserUtils.isLocalHost()&&!e.webConfig.isStatic||n.isNodeJS?"https://www.makecode.com/api/":"/api/"'
        ],
        after: 't.apiRoot=e.BrowserUtils.isLocalHost()&&!("undefined"!=typeof pxtConfig&&pxtConfig.isStatic)||n.isNodeJS?"https://www.makecode.com/api/":"/api/"'
    },
    {
        name: "use the serving origin API for the static web application",
        filename: webAppPath,
        before: [
            't.apiRoot=e.BrowserUtils.isLocalHost()||n.isNodeJS?"https://www.makecode.com/api/":"/api/"',
            't.apiRoot=e.BrowserUtils.isLocalHost()&&!e.webConfig.isStatic||n.isNodeJS?"https://www.makecode.com/api/":"/api/"'
        ],
        after: 't.apiRoot=e.BrowserUtils.isLocalHost()&&!("undefined"!=typeof pxtConfig&&pxtConfig.isStatic)||n.isNodeJS?"https://www.makecode.com/api/":"/api/"'
    }
];

for (const patch of libraryPatches) {
    let source = fs.readFileSync(patch.filename, "utf8");
    const beforeCounts = patch.before.map(value => source.split(value).length - 1);
    const beforeCount = beforeCounts.reduce((sum, value) => sum + value, 0);
    const afterCount = source.split(patch.after).length - 1;
    if (beforeCount === 1 && afterCount === 0) {
        source = source.replace(patch.before[beforeCounts.findIndex(value => value === 1)], patch.after);
        fs.writeFileSync(patch.filename, source);
        changed = true;
    } else if (beforeCount !== 0 || afterCount !== 1) {
        fail(`cannot apply '${patch.name}': before=${beforeCount}, after=${afterCount}`);
    }
}

console.log(`pxt-core ${expectedVersion} local patches: ${changed ? "applied" : "verified"}`);
