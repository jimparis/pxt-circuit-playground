# Circuit Playground MakeCode

A unified Microsoft MakeCode target for the Adafruit Circuit Playground
Express (SAMD21) and Circuit Playground Bluefruit (nRF52840).

The editor is derived from `microsoft/pxt-maker`, but its bundled board list,
APIs, simulator, documentation, firmware caches, and release packaging are
focused on Circuit Playground. The production site is intended for
<https://makecode.jim.sh/>.

## Workspace development

This repository is one of three peer repositories orchestrated from
`/home/jim/git/makecode`. Use the top-level Makefile so the pinned Node 22
container and validation gates stay consistent:

```sh
cd /home/jim/git/makecode
make pxt-install
make pxt-check
make pxt-serve
```

`make pxt-check` runs target and simulator generation, strict TypeScript and
documentation checks, board-switching capability tests, native CPX/CPB builds,
generated-file drift detection, and cached firmware address validation.

The local editor listens only on loopback. Production uses a versioned static
package; it must not bind-mount a source checkout over the application.

## Repositories

- `pxt-circuit-playground` — target, packages, simulator, docs, and web assets
- `codal-circuit-playground-bluefruit` — CPB-specific native runtime work
- `Adafruit_nRF52_Bootloader` — CPB bootloader and HF2 WebUSB work

See the workspace `STATUS.md` for the current implementation state, ordered
work, memory boundaries, and acceptance criteria.

## License and upstream

This repository retains the upstream MIT license and third-party notices.
Microsoft MakeCode, PXT, and upstream board/runtime projects remain the work of
their respective authors. This Circuit Playground target is an independent,
unofficial project and is not an Adafruit or Microsoft product.
