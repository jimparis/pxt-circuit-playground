# Enable direct transfer on Bluefruit

Circuit Playground Bluefruit's stock Adafruit bootloader supports copying UF2
files to `CPLAYBTBOOT`, but it does not have the HF2 USB interface used by this
editor for direct transfer. This optional, one-time update installs our
[source-available Adafruit bootloader fork](https://github.com/jimparis/Adafruit_nRF52_Bootloader)
with bounded HF2 support.

You do not need this update to use **Download as File** and copy UF2 files
manually. This firmware is unofficial and has not been endorsed by Adafruit.

## Before updating

1. Confirm that the board is an **Adafruit Circuit Playground Bluefruit**. Do
   not use this updater on Circuit Playground Express or another nRF52840
   board.
2. Double-press reset to open `CPLAYBTBOOT`, then open `INFO_UF2.TXT`. The
   installed UF2 bootloader must be version 0.4.0 or newer. For an older
   bootloader, first follow
   [Adafruit's serial update instructions](https://learn.adafruit.com/adafruit-circuit-playground-bluefruit/update-bootloader-use-command-line),
   which normally do not require an SWD programmer.
3. Save any program you want to keep. Updating the bootloader may erase the
   program currently stored on the board; you can send it again afterward.
4. Use a reliable USB data cable and do not unplug or reset the board while the
   updater is being copied or installed.

## Install the HF2 bootloader

1. Double-press reset. The `CPLAYBTBOOT` drive should appear.
2. [Download the Circuit Playground Bluefruit HF2 bootloader updater](/static/firmware/update-circuitplayground_nrf52840_bootloader-makecode-hf2-nosd.uf2).
3. Copy the downloaded `.uf2` file to `CPLAYBTBOOT`.
4. Wait for the copy and update to finish. The drive will disconnect and may
   reconnect while the board restarts.
5. Double-press reset again, open `INFO_UF2.TXT`, and confirm that it contains
   `MakeCode-HF2: enabled`.
6. Return to the editor, choose **Circuit Playground Bluefruit**, and select
   **Connect Device**.

The updater is restricted to the Bluefruit board identity and preserves the
installed Nordic SoftDevice. The editor's release build verifies the updater's
board ID, UF2 family, vector table, flash address bounds, UICR values, block
completeness, and checksum before it can be included on this site.

## Recovery

If `CPLAYBTBOOT` still appears, repeat the copy with the correct updater or
install an official Adafruit Bluefruit bootloader updater. If the drive does
not appear after several deliberate double-presses of reset, stop and use an
SWD programmer to restore the combined SoftDevice and bootloader recovery
image from the same source release. Do not try updater files intended for a
different board.
