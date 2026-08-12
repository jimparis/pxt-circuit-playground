"use strict";

const fs = require("fs");
const path = require("path");

const boards = [
    { name: "CPX", start: 0x2000, end: 0x40000 },
    { name: "CPB", start: 0x26000, end: 0xea000 }
];

function parseHex(filename) {
    let upperAddress = 0;
    let minimum = Infinity;
    let maximum = -1;
    let bytes = 0;
    const data = [];
    const lines = fs.readFileSync(filename, "utf8").trim().split(/\r?\n/);

    lines.forEach((line, index) => {
        if (!/^:[0-9a-f]+$/i.test(line) || line.length % 2 !== 1)
            throw new Error(`${filename}:${index + 1}: invalid Intel HEX record`);

        const record = Buffer.from(line.slice(1), "hex");
        const length = record[0];
        if (record.length !== length + 5)
            throw new Error(`${filename}:${index + 1}: incorrect record length`);

        let checksum = 0;
        for (const value of record)
            checksum = (checksum + value) & 0xff;
        if (checksum !== 0)
            throw new Error(`${filename}:${index + 1}: incorrect checksum`);

        const offset = record.readUInt16BE(1);
        const type = record[3];
        if (type === 0) {
            const start = upperAddress + offset;
            const payload = record.subarray(4, 4 + length);
            minimum = Math.min(minimum, start);
            maximum = Math.max(maximum, start + length);
            bytes += length;
            data.push({ start, payload });
        } else if (type === 2) {
            upperAddress = record.readUInt16BE(4) << 4;
        } else if (type === 4) {
            upperAddress = record.readUInt16BE(4) * 0x10000;
        }
    });

    if (!bytes)
        throw new Error(`${filename}: contains no data records`);
    return { minimum, maximum, bytes, data };
}

function findUint32LE(image, value) {
    const needle = Buffer.alloc(4);
    needle.writeUInt32LE(value);
    return image.data.flatMap(record => {
        const addresses = [];
        let offset = 0;
        while ((offset = record.payload.indexOf(needle, offset)) !== -1) {
            addresses.push(record.start + offset);
            offset++;
        }
        return addresses;
    });
}

const directory = process.argv[2];
if (!directory)
    throw new Error("usage: check-firmware-bounds.js HEX_DIRECTORY [CPX|CPB]");

const requestedBoardName = process.argv[3];
const requiredBoards = requestedBoardName
    ? boards.filter(board => board.name === requestedBoardName.toUpperCase())
    : boards;
if (!requiredBoards.length)
    throw new Error(`unknown board ${requestedBoardName}; expected CPX or CPB`);

const files = fs.readdirSync(directory)
    .filter(filename => filename.endsWith(".hex"))
    .map(filename => path.join(directory, filename));

if (!files.length)
    throw new Error(`${directory}: no cached firmware images found`);

const seen = new Set();
for (const filename of files) {
    const image = parseHex(filename);
    const board = boards.find(candidate => candidate.start === image.minimum);
    if (!board)
        throw new Error(`${filename}: unknown application start 0x${image.minimum.toString(16)}`);
    if (image.maximum > board.end)
        throw new Error(`${filename}: ${board.name} data ends at 0x${image.maximum.toString(16)}, beyond 0x${board.end.toString(16)}`);
    if (board.name === "CPX") {
        const bootMagic = findUint32LE(image, 0xf01669ef);
        const quickBootMagic = findUint32LE(image, 0xf02669ef);
        if (!bootMagic.length || !quickBootMagic.length)
            throw new Error(`${filename}: CPX firmware lacks the Adafruit UF2 reset sentinels`);
        console.log(`CPX WebUSB reset sentinels: bootloader ${bootMagic.map(address =>
            `0x${address.toString(16)}`).join(", ")}; application ${quickBootMagic.map(address =>
            `0x${address.toString(16)}`).join(", ")}`);
    }
    seen.add(board.name);
    console.log(`${board.name}: ${path.basename(filename)} covers 0x${image.minimum.toString(16)}..<0x${image.maximum.toString(16)} (${image.bytes} data bytes)`);
}

for (const board of requiredBoards) {
    if (!seen.has(board.name))
        throw new Error(`${directory}: no ${board.name} firmware image found`);
}
