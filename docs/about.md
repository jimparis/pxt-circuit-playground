# About

Circuit Playground MakeCode is a Blocks, JavaScript, and Python editor for two
Adafruit boards:

- [Circuit Playground Express](/boards/adafruit-circuit-playground-express)
- [Circuit Playground Bluefruit](/boards/adafruit-circuit-playground-bluefruit)

Choose the board whose name matches the label on the device. A project can be
switched between boards without changing its source. Shared Circuit Playground
features compile on both; a board-specific feature remains in the program and
produces a compiler diagnostic when the selected board does not support it.

## Program and test

Programs can be written with [Blocks](/blocks), [JavaScript](/javascript), or
Python in a modern browser. The simulator provides a quick test before code is
downloaded to a physical board.

```blocks
input.buttonA.onEvent(ButtonEvent.Click, function () {
    light.showRing("red orange yellow green blue indigo violet purple white black")
})
```

## Download

Connect the Circuit Playground with a data-capable USB cable. A UF2 download
can be copied to the board's bootloader drive. UF2 remains the recovery and
Firefox-compatible workflow; direct WebUSB support depends on the selected
board and installed bootloader.

## Open source

The target source is maintained at
<https://github.com/jimparis/pxt-circuit-playground>. It is based on Microsoft
MakeCode and upstream open-source board/runtime projects. This is an
independent, unofficial project, not an Adafruit or Microsoft product.
