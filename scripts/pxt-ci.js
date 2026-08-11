"use strict";

const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const cli = path.join(root, "node_modules", "pxt-core", "built", "pxt.js");

function workspaceSnapshot() {
    const names = childProcess.execFileSync(
        "git",
        ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        { cwd: root }
    ).toString().split("\0").filter(Boolean);

    const snapshot = new Map();
    for (const name of names) {
        const filename = path.join(root, name);
        if (!fs.existsSync(filename)) continue;
        const contents = fs.readFileSync(filename);
        snapshot.set(name, crypto.createHash("sha256").update(contents).digest("hex"));
    }
    return snapshot;
}

function changedPaths(before, after) {
    const names = new Set([...before.keys(), ...after.keys()]);
    return [...names].filter(name => before.get(name) !== after.get(name)).sort();
}

const before = workspaceSnapshot();
// The CLI otherwise prefers a possibly stale generated target over the edited
// pxtarget.json. The top-level build seeds built/hexcache with the local CPB
// runtime before invoking this wrapper, so regeneration does not need the
// unpublished target from the public compile service.
fs.rmSync(path.join(root, "built", "target.json"), { force: true });
const child = childProcess.spawn(process.execPath, [cli, "ci"], {
    cwd: root,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"]
});

let output = "";

function forward(stream, destination) {
    stream.on("data", chunk => {
        const text = chunk.toString();
        output += text;
        destination.write(chunk);
    });
}

forward(child.stdout, process.stdout);
forward(child.stderr, process.stderr);

child.on("error", error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
});

child.on("close", (code, signal) => {
    const drift = changedPaths(before, workspaceSnapshot());
    if (signal) {
        console.error(`PXT CI terminated by ${signal}`);
        process.exitCode = 1;
    } else if (code) {
        process.exitCode = code;
    } else if (/\berror TS\d+:/i.test(output)) {
        console.error("PXT CI emitted TypeScript errors despite returning success.");
        process.exitCode = 1;
    }
    if (drift.length) {
        console.error("PXT CI changed source-controlled files; commit regenerated output before retrying:");
        for (const name of drift) console.error(`  ${name}`);
        process.exitCode = 1;
    }
});
