"use strict";

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outputRoot = path.join(root, "built", "board-contract");
const cli = path.join(root, "node_modules", "pxt-core", "built", "pxt.js");
const fixtures = path.join(root, "tests", "board-contract");

function writeProject(name, board, source, extraDependencies = {}) {
    const directory = path.join(outputRoot, name);
    fs.rmSync(directory, { recursive: true, force: true });
    fs.mkdirSync(directory, { recursive: true });
    fs.copyFileSync(path.join(fixtures, source), path.join(directory, "main.ts"));
    fs.writeFileSync(path.join(directory, "pxt.json"), JSON.stringify({
        name,
        files: ["main.ts"],
        dependencies: {
            [board]: `file:../../../libs/${board}`,
            ...extraDependencies
        }
    }, null, 4) + "\n");
    return directory;
}

function switchBoard(directory, board) {
    const configPath = path.join(directory, "pxt.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config.dependencies = {
        [board]: `file:../../../libs/${board}`
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4) + "\n");
}

function assertSourceUnchanged(directory, source) {
    const actual = fs.readFileSync(path.join(directory, "main.ts"), "utf8");
    const expected = fs.readFileSync(path.join(fixtures, source), "utf8");
    if (actual !== expected) throw new Error("Changing boards modified main.ts");
}

function build(name, directory, shouldPass, expectedDiagnostic) {
    const result = childProcess.spawnSync(process.execPath, [cli, "build"], {
        cwd: directory,
        encoding: "utf8"
    });
    const output = `${result.stdout || ""}${result.stderr || ""}`;
    process.stdout.write(output);

    const emittedTypeScriptError = /\berror TS\d+:/i.test(output);
    const passed = result.status === 0 && !emittedTypeScriptError;
    if (passed !== shouldPass) {
        throw new Error(`${name} ${passed ? "passed" : "failed"}; expected ${shouldPass ? "success" : "failure"}`);
    }
    if (expectedDiagnostic && !expectedDiagnostic.test(output)) {
        throw new Error(`${name} did not emit the expected unsupported-feature diagnostic`);
    }
    console.log(`${name}: ${shouldPass ? "compiled" : "rejected as expected"}`);
}

fs.rmSync(outputRoot, { recursive: true, force: true });

const shared = writeProject(
    "shared-capabilities",
    "adafruit-circuit-playground-express",
    "shared.ts"
);
build("CPX shared capability contract", shared, true);
switchBoard(shared, "adafruit-circuit-playground-bluefruit");
assertSourceUnchanged(shared, "shared.ts");
build("CPB shared capability contract after board switch", shared, true);

const infrared = writeProject(
    "board-specific-infrared",
    "adafruit-circuit-playground-express",
    "infrared.ts"
);
build("CPX infrared capability", infrared, true);
switchBoard(infrared, "adafruit-circuit-playground-bluefruit");
assertSourceUnchanged(infrared, "infrared.ts");
build("CPB infrared capability after board switch", infrared, false, /infraredSendNumber|network|TS\d+/i);
