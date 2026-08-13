"use strict";

const childProcess = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.join(__dirname, "..");
const cli = path.join(root, "node_modules", "pxt-core", "built", "pxt.js");
const postcss = require("postcss");
const cssnano = require("cssnano")({
    zindex: false,
    autoprefixer: {
        browsers: [
            "Chrome >= 38",
            "Firefox >= 31",
            "Edge >= 12",
            "ie >= 11",
            "Safari >= 9",
            "Opera >= 21",
            "iOS >= 9",
            "ChromeAndroid >= 59",
            "FirefoxAndroid >= 55"
        ],
        add: true
    }
});
const outputDirectory = process.argv[2]
    ? path.resolve(process.argv[2])
    : fs.mkdtempSync(path.join(os.tmpdir(), "circuit-playground-staticpkg-"));
const sourceTarget = JSON.parse(fs.readFileSync(path.join(root, "pxtarget.json"), "utf8"));
const baseProjects = (sourceTarget.staticpkgdirs && sourceTarget.staticpkgdirs.base) || [];
const pageBackground = sourceTarget.appTheme.backgroundColor.toLowerCase();
const releaseId = process.env.PXT_STATIC_RELEASE_ID || "local-static-test";
if (!/^[A-Za-z0-9_.-]{1,128}$/.test(releaseId)) {
    throw new Error("PXT_STATIC_RELEASE_ID must be a safe release identifier");
}

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

function requireFile(name) {
    if (!fs.statSync(path.join(outputDirectory, name)).isFile()) {
        throw new Error(`Static package is missing ${name}`);
    }
}

async function canonicalizeCss(name) {
    const filename = path.join(outputDirectory, name);
    const processed = await postcss([cssnano]).process(
        fs.readFileSync(filename, "utf8"),
        { from: filename, to: filename }
    );

    // PXT can concatenate normalize.css either before Semantic UI's Site
    // component or near the end of Transition. cssnano preserves both
    // arrangements and, when normalize comes first, merges body { margin: 0 }
    // into Site. Relocate that known reset as an AST block and make the merge
    // explicit so identical inputs always produce identical release bytes.
    const css = processed.root;
    css.walkComments(comment => {
        if (/normalize\.css v7\.0\.0/.test(comment.text)) comment.remove();
    });

    const normalizeStarts = css.nodes.filter(node =>
        node.type === "rule" &&
        node.selector === "html" &&
        node.nodes.some(declaration =>
            declaration.prop === "line-height" && declaration.value === "1.15") &&
        node.nodes.some(declaration => declaration.prop === "-ms-text-size-adjust")
    );
    if (normalizeStarts.length !== 1) {
        throw new Error(`${name} has ${normalizeStarts.length} normalize.css reset starts; expected one`);
    }
    const normalizeStart = css.nodes.indexOf(normalizeStarts[0]);
    const normalizeEnd = css.nodes.findIndex((node, index) =>
        index >= normalizeStart &&
        node.type === "rule" &&
        node.selector === "[hidden],template"
    );
    if (normalizeEnd < normalizeStart) {
        throw new Error(`${name} is missing the end of its normalize.css reset`);
    }
    const normalizeNodes = css.nodes.splice(
        normalizeStart,
        normalizeEnd - normalizeStart + 1
    );

    const resetBody = normalizeNodes.filter(node =>
        node.type === "rule" &&
        node.selector === "body" &&
        node.nodes.length === 1 &&
        node.nodes[0].prop === "margin" &&
        node.nodes[0].value === "0"
    );
    if (resetBody.length > 1) {
        throw new Error(`${name} has duplicate normalize.css body resets`);
    }
    if (resetBody.length) normalizeNodes.splice(normalizeNodes.indexOf(resetBody[0]), 1);

    const siteBodies = css.nodes.filter(node =>
        node.type === "rule" &&
        node.selector === "body" &&
        node.nodes.some(declaration =>
            declaration.prop === "background" && declaration.value.toLowerCase() === pageBackground)
    );
    if (siteBodies.length !== 1) {
        throw new Error(`${name} has ${siteBodies.length} Semantic UI Site body rules; expected one`);
    }
    const siteBody = siteBodies[0];
    const siteMargins = siteBody.nodes.filter(declaration => declaration.prop === "margin");
    if (siteMargins.some(declaration => declaration.value !== "0") || siteMargins.length > 1) {
        throw new Error(`${name} has an unexpected Semantic UI Site body margin`);
    }
    if (!siteMargins.length) {
        const minWidth = siteBody.nodes.find(declaration => declaration.prop === "min-width");
        if (!minWidth) throw new Error(`${name} Semantic UI Site body is missing min-width`);
        siteBody.insertBefore(minWidth, postcss.decl({ prop: "margin", value: "0" }));
    }

    const siteIndex = css.nodes.findIndex(node =>
        node.type === "comment" && /Semantic UI - Site/.test(node.text)
    );
    if (siteIndex < 0) throw new Error(`${name} is missing its Semantic UI Site marker`);
    const normalizeLicense = postcss.comment({
        text: "! normalize.css v7.0.0 | MIT License | github.com/necolas/normalize.css"
    });
    normalizeLicense.raws.before = "\n";
    normalizeLicense.raws.left = " ";
    normalizeLicense.raws.right = " ";
    for (const node of normalizeNodes) node.raws.before = "";
    css.nodes.splice(siteIndex, 0, normalizeLicense, ...normalizeNodes);

    fs.writeFileSync(filename, css.toString());
}

function filesBelow(directory) {
    const result = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filename = path.join(directory, entry.name);
        if (entry.isDirectory()) result.push(...filesBelow(filename));
        else if (entry.isFile()) result.push(filename);
    }
    return result;
}

function removeTelemetry() {
    const telemetryScript = /<script\b[^>]*>\s*window\.loadAppInsights = function[\s\S]*?pxt\.initAnalyticsAsync\(\);\s*<\/script>/g;
    let removedScripts = 0;
    for (const filename of filesBelow(outputDirectory).filter(name => name.endsWith(".html"))) {
        const before = fs.readFileSync(filename, "utf8");
        const after = before.replace(telemetryScript, () => {
            removedScripts++;
            return "<!-- Telemetry disabled for the self-hosted Circuit Playground editor. -->";
        });
        if (/window\.loadAppInsights|pxt\.initAnalyticsAsync\(\)/.test(after)) {
            throw new Error(`Static package still contains active telemetry in ${filename}`);
        }
        if (after !== before) fs.writeFileSync(filename, after);
    }
    if (!removedScripts) throw new Error("Static package contained no telemetry scripts to disable");

    const applicationInsightsSdk = path.join(outputDirectory, "ai.2.min.js");
    if (fs.existsSync(applicationInsightsSdk)) fs.unlinkSync(applicationInsightsSdk);
    console.log(`Disabled ${removedScripts} Application Insights bootstrap script(s)`);
}

const before = workspaceSnapshot();
const child = childProcess.spawn(process.execPath, [
    cli,
    "staticpkg",
    "--output", outputDirectory,
    "--route", "/",
    "--release-id", releaseId,
    "--no-appcache"
], {
    cwd: root,
    // PXT only reports the project-to-native-image mapping in debug output.
    // Capture it so the release contains current base images, rather than every
    // historical cache file left by development builds.
    env: { ...process.env, PXT_DEBUG: "1" },
    stdio: ["inherit", "pipe", "pipe"]
});

let output = "";
const verbose = process.env.PXT_STATIC_VERBOSE === "1";
for (const [stream, destination] of [
    [child.stdout, process.stdout],
    [child.stderr, process.stderr]
]) {
    stream.on("data", chunk => {
        output += chunk.toString();
        if (verbose) destination.write(chunk);
    });
}

child.on("error", error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
});

child.on("close", async (code, signal) => {
    try {
        if (signal) throw new Error(`PXT static package terminated by ${signal}`);
        if (code) {
            throw new Error(`PXT static package exited with status ${code}:\n${output.slice(-20000)}`);
        }
        if (/\berror TS\d+:/i.test(output)) {
            throw new Error("PXT static package emitted TypeScript errors despite returning success");
        }

        // PXT can emit two equivalent reset layouts; canonicalize their ASTs
        // so release comparison does not depend on concatenation order.
        await canonicalizeCss("semantic.css");
        await canonicalizeCss("rtlsemantic.css");
        removeTelemetry();

        const buildOnlyPaths = [
            "board-contract",
            "cpb-native-project",
            "dockercodal",
            "static-cache-audit",
            "static-release"
        ];
        const removedBuildPaths = [];
        for (const name of buildOnlyPaths) {
            const filename = path.join(outputDirectory, name);
            if (fs.existsSync(filename)) {
                fs.rmSync(filename, { recursive: true, force: true });
                removedBuildPaths.push(name);
            }
        }

        const webManifestPath = path.join(outputDirectory, "sim.webmanifest");
        const webManifest = JSON.parse(fs.readFileSync(webManifestPath, "utf8"));
        for (const icon of webManifest.icons || []) {
            const basename = path.basename(icon.src);
            const localName = path.join("docs", "static", "icons", basename);
            if (!fs.existsSync(path.join(outputDirectory, localName))) {
                throw new Error(`PWA manifest icon is missing from the static package: ${localName}`);
            }
            icon.src = `/${localName.split(path.sep).join("/")}`;
            if (icon.types && !icon.type) icon.type = icon.types;
            delete icon.types;
        }
        fs.writeFileSync(webManifestPath, `${JSON.stringify(webManifest, null, 4)}\n`);
        if (/@(?:cdnUrl|commitCdnUrl|relprefix)@/.test(fs.readFileSync(webManifestPath, "utf8"))) {
            throw new Error("PWA manifest contains an unresolved deployment placeholder");
        }

        for (const name of ["serviceworker.js", "simulatorserviceworker.js"]) {
            const worker = fs.readFileSync(path.join(outputDirectory, name), "utf8");
            if (/@(?:cdnUrl|pxtRelId|relprefix|simUrl|simworkerconfigUrl|targetUrl)@/.test(worker)) {
                throw new Error(`${name} contains an unresolved deployment placeholder`);
            }
            if (!worker.includes(releaseId)) {
                throw new Error(`${name} does not contain the static release ID`);
            }
        }

        const drift = changedPaths(before, workspaceSnapshot());
        if (drift.length) {
            throw new Error(`PXT static package changed source-controlled files:\n  ${drift.join("\n  ")}`);
        }

        for (const name of [
            "index.html",
            "simulator.html",
            "target.js",
            "target.json",
            "docs/about.html",
            "docs/boards.html",
            "docs/privacy.html",
            "docs/terms.html",
            "docs/static/60-circuit-playground-webusb.rules",
            "docs/static/home-banner-mist.png",
            "docs/static/home-banner-ocean.png"
        ]) requireFile(name);

        const target = JSON.parse(fs.readFileSync(path.join(outputDirectory, "target.json"), "utf8"));
        const heroImages = [
            "docs/static/home-banner-mist.png",
            "docs/static/home-banner-ocean.png"
        ];
        if (JSON.stringify(target.appTheme.homeScreenHero) !== JSON.stringify(heroImages)) {
            throw new Error("Static package has invalid home-screen banner metadata");
        }
        for (const url of heroImages) {
            const image = fs.readFileSync(path.join(outputDirectory, url));
            if (image.length < 24 || image.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
                image.readUInt32BE(16) !== 1875 || image.readUInt32BE(20) !== 675) {
                throw new Error(`Static package has an invalid home-screen banner: ${url}`);
            }
        }
        const rulesName = "60-circuit-playground-webusb.rules";
        if (target.appTheme.linuxUdevRulesUrl !== `/static/${rulesName}` ||
            target.appTheme.linuxUdevRulesFileName !== rulesName) {
            throw new Error("Static package has invalid Linux device-rules metadata");
        }
        if (!target.appTheme.guidedDownloadFlow ||
            target.appTheme.guidedDownloadRequiresWebHID ||
            !target.appTheme.downloadDialogTheme ||
            target.compile.hidSelectors?.length ||
            target.appTheme.driveDisplayNames?.["adafruit-circuit-playground-express"] !== "CPLAYBOOT" ||
            target.appTheme.driveDisplayNames?.["adafruit-circuit-playground-bluefruit"] !== "CPLAYBTBOOT") {
            throw new Error("Static package has invalid guided-download metadata");
        }
        const packagedRules = fs.readFileSync(
            path.join(outputDirectory, "docs", "static", rulesName), "utf8");
        const sourceRules = fs.readFileSync(
            path.join(root, "docs", "static", rulesName), "utf8");
        if (packagedRules !== sourceRules) {
            throw new Error("Static package Linux device rules differ from the target source");
        }
        for (const board of [
            "adafruit-circuit-playground-express",
            "adafruit-circuit-playground-bluefruit"
        ]) {
            if (!target.bundledpkgs || !target.bundledpkgs[board]) {
                throw new Error(`Static package target metadata is missing ${board}`);
            }
        }
        if (Object.keys(target.variants).sort().join(",") !== "nrf52840,samd21") {
            throw new Error("Static package contains unexpected compile variants");
        }

        const cachesByProject = new Map(baseProjects.map(project => [project, new Set()]));
        const cachePattern = /(?:native image already|created native image) in offline cache for project ([^:]+): .*[/\\]([0-9a-f]{64})\.hex/g;
        let cacheMatch;
        while ((cacheMatch = cachePattern.exec(output)) !== null) {
            const hashes = cachesByProject.get(cacheMatch[1]);
            if (hashes) hashes.add(cacheMatch[2]);
        }
        for (const [project, hashes] of cachesByProject) {
            if (!hashes.size) {
                throw new Error(`Static package did not report a native image for ${project}`);
            }
        }
        const requiredCaches = new Set(
            [...cachesByProject.values()].flatMap(hashes => [...hashes])
        );
        const hexCacheDirectory = path.join(outputDirectory, "hexcache");
        const removedCaches = [];
        for (const name of fs.readdirSync(hexCacheDirectory)) {
            const match = /^([0-9a-f]{64})\.hex$/.exec(name);
            if (match && !requiredCaches.has(match[1])) {
                fs.unlinkSync(path.join(hexCacheDirectory, name));
                removedCaches.push(name);
            }
        }
        const releaseCaches = fs.readdirSync(hexCacheDirectory)
            .filter(name => /^[0-9a-f]{64}\.hex$/.test(name));
        if (releaseCaches.length !== requiredCaches.size ||
            releaseCaches.some(name => !requiredCaches.has(name.slice(0, -4)))) {
            throw new Error("Static package firmware cache does not match its base projects");
        }
        for (const [project, hashes] of cachesByProject) {
            console.log(`${project} firmware cache: ${[...hashes].join(", ")}`);
        }

        const serviceWorkerPath = path.join(outputDirectory, "serviceworker.js");
        const serviceWorker = fs.readFileSync(serviceWorkerPath, "utf8");
        const encodedCacheList = /%2Fhexcache%2F[0-9a-f]{64}\.hex(?:;%2Fhexcache%2F[0-9a-f]{64}\.hex)*/;
        const releaseCacheUrls = releaseCaches.sort()
            .map(name => encodeURIComponent(`/hexcache/${name}`))
            .join(";");
        if (!encodedCacheList.test(serviceWorker)) {
            throw new Error("Static service worker does not contain its firmware cache list");
        }
        const prunedServiceWorker = serviceWorker.replace(encodedCacheList, releaseCacheUrls);
        const cachedFirmware = [...prunedServiceWorker.matchAll(/%2Fhexcache%2F([0-9a-f]{64})\.hex/g)]
            .map(match => match[1]);
        if (cachedFirmware.length !== requiredCaches.size ||
            cachedFirmware.some(hash => !requiredCaches.has(hash))) {
            throw new Error("Static service worker firmware list does not match its base projects");
        }
        fs.writeFileSync(serviceWorkerPath, prunedServiceWorker);

        if (removedCaches.length) {
            console.log(`Removed ${removedCaches.length} obsolete firmware cache file(s) from the static package`);
        }
        if (removedBuildPaths.length) {
            console.log(`Removed build-only static paths: ${removedBuildPaths.join(", ")}`);
        }

        const bounds = childProcess.spawnSync(process.execPath, [
            path.join(root, "scripts", "check-firmware-bounds.js"),
            path.join(outputDirectory, "hexcache")
        ], { cwd: root, encoding: "utf8" });
        process.stdout.write(bounds.stdout || "");
        process.stderr.write(bounds.stderr || "");
        if (bounds.status) throw new Error("Static package firmware cache failed validation");

        console.log(`Static package validated in ${outputDirectory}`);
    } catch (error) {
        console.error(error.stack || error.message);
        process.exitCode = 1;
    }
});
