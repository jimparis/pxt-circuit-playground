# Enable direct transfer on Express

Circuit Playground Express bootloaders have always supported copying UF2 files
to `CPLAYBOOT`. Adafruit's official UF2 bootloader v4 also provides the stable
serial identity and HF2 WebUSB interface that this editor needs to reconnect
automatically during a direct transfer.

You do not need this update to use **Download as File** and copy UF2 files
manually. The updater is built unmodified from
[Adafruit's official uf2-samdx1 v4.0.0 source](https://github.com/adafruit/uf2-samdx1/tree/v4.0.0),
pinned and checksum-validated by this site's release build.

## Before updating

1. Confirm that the board is an **Adafruit Circuit Playground Express**. Do not
   use this updater on Circuit Playground Bluefruit or another SAMD board.
2. Save any program you want to keep. The updater uses the application area and
   will erase the program currently stored on the board; you can send it again
   afterward.
3. Use a reliable USB data cable and do not unplug or reset the board while the
   updater is being copied or installed.

## Install Adafruit UF2 bootloader v4

1. Double-press reset. The `CPLAYBOOT` drive should appear.
2. [Download the official-source Circuit Playground Express bootloader updater](/static/firmware/update-circuit-playground-express-bootloader-v4.0.0.uf2).
3. Copy the downloaded `.uf2` file to `CPLAYBOOT`.
4. Wait for the copy and update to finish. The drive will disconnect and then
   reconnect as the new bootloader starts.
5. Open `INFO_UF2.TXT` on `CPLAYBOOT` and confirm that its bootloader version is
   `v4.0.0`.
6. Return to the editor, choose **Circuit Playground Express**, and select
   **Connect Device**.

The release build verifies the updater's UF2 structure, vector table, address
bounds, completeness, embedded bootloader size, persistent USB serial
descriptor, HID compatibility interface, WebUSB capability, and checksum. The
updater temporarily changes the SAMD21 boot-protection fuse, writes exactly the
8 KiB bootloader region, restores boot protection, and restarts the board.

## Recovery

If `CPLAYBOOT` still appears, repeat the copy with the correct updater or use an
[official Adafruit Circuit Playground Express updater](https://learn.adafruit.com/adafruit-circuit-playground-express/adafruit2-uf2-bootloader-details#updating-the-bootloader).
If the drive does not appear after several deliberate double-presses of reset,
stop and restore the bootloader with an SWD programmer. Do not try an updater
intended for another board.
