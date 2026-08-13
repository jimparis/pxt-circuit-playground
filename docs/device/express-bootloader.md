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

## Quick update instructions

1. Save the program currently on the board; the update erases it.
2. Double-press reset. A drive named `CPLAYBOOT` should appear.
3. Download
   [`update-circuit-playground-express-bootloader-v4.0.0.uf2`](/static/firmware/update-circuit-playground-express-bootloader-v4.0.0.uf2).
4. Copy that file onto the `CPLAYBOOT` drive.
5. Wait without unplugging the board. `CPLAYBOOT` will disconnect and then
   reconnect as the new bootloader starts.
6. Open `INFO_UF2.TXT` on `CPLAYBOOT` and confirm that its bootloader version is
   `v4.0.0`.
7. Return to the editor, choose **Circuit Playground Express**, and select
   **Connect Device**.

The release build verifies the updater's UF2 structure, vector table, address
bounds, completeness, embedded bootloader size, persistent USB serial
descriptor, HID compatibility interface, WebUSB capability, and checksum. The
updater temporarily changes the SAMD21 boot-protection fuse, writes exactly the
8 KiB bootloader region, restores boot protection, and restarts the board.

## Older v1.22.0 SFHR boards

If the copied updater remains visible on `CPLAYBOOT`, the board never
disconnects, and `INFO_UF2.TXT` still says `v1.22.0 SFHR`, the update did not
run. On Linux, use the checked HID fallback from the
[public project repository](https://github.com/jimparis/makecode):

```sh
make submodules-init
sudo make udev-install       # once per Linux computer
make cpx-bootloader-install
```

The last command identifies the CPX, checks the updater, asks for confirmation,
writes it through the old bootloader's HID interface, verifies every page, and
confirms v4.0.0 after the board reconnects. It will not rewrite a board that is
already current.

## Recovery

If the normal copy does not update an older SFHR board, use the HID fallback
above. For other recovery options, see the
[official Adafruit Circuit Playground Express updater](https://learn.adafruit.com/adafruit-circuit-playground-express/adafruit2-uf2-bootloader-details#updating-the-bootloader).
If the drive does not appear after several deliberate double-presses of reset,
stop and restore the bootloader with an SWD programmer. Do not try an updater
intended for another board.
