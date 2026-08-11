# Choose or change boards

Circuit Playground MakeCode supports two boards:

* [Circuit Playground Express](/boards/adafruit-circuit-playground-express)
* [Circuit Playground Bluefruit](/boards/adafruit-circuit-playground-bluefruit)

Choose the board you have when you create a project. To move an existing
project, open the board selector from the editor menu and choose the other
Circuit Playground board.

## What stays the same

Changing boards keeps your project source. Shared features such as buttons,
the slide switch, pixels, light, temperature, sound, the microphone, and the
named `A0` through `A7` pins use the same blocks and TypeScript APIs on both
boards.

After changing boards, compile the project again before downloading. The new
UF2 is built specifically for the selected board; do not copy a UF2 built for
the other board.

## Board-specific features

Some hardware is not shared. For example, the infrared API is available on
Circuit Playground Express but not on Circuit Playground Bluefruit. If a
project uses a board-specific feature, changing boards keeps the source and
shows a compiler diagnostic for the unsupported call. Return to the original
board or remove that call; MakeCode will not silently rewrite the program.

Circuit Playground Bluefruit Bluetooth and capacitive touch are not enabled in
the current UF2 alpha. They will appear only after their native support has
been implemented and tested.
