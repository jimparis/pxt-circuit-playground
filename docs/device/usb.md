# Download with USB and UF2

Use a USB data cable to connect your Circuit Playground board. A charge-only
cable can power the board but cannot transfer a program.

## Copy a program to the board

1. In MakeCode, confirm that the selected board matches your hardware.
2. Select **Download** to build the board-specific `.uf2` file.
3. Put the board in bootloader mode. If its bootloader drive is not already
   visible, press the board's reset button twice in quick succession.
4. Copy the downloaded `.uf2` file to the bootloader drive.
5. Wait for the copy to finish. The drive normally disconnects and the new
   program starts automatically.

UF2 download works without WebUSB and is the supported fallback in Firefox.
It also remains the recovery path if direct upload is unavailable.

## If the bootloader drive does not appear

Try another USB port and a known data cable, disconnect battery power, and
double-press reset again. A slowly pulsing or colored bootloader status LED is
normal; its exact pattern depends on the installed bootloader version.

Do not copy a Circuit Playground Express UF2 to Circuit Playground Bluefruit,
or a Bluefruit UF2 to an Express. Return to the editor, select the correct
board, and download again.

Direct WebUSB upload for Circuit Playground Bluefruit is still under
development. The current alpha uses UF2 download for Bluefruit programming.
