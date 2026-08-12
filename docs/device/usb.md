# Program a board over USB

Use a USB data cable to connect your Circuit Playground board. A charge-only
cable can power the board but cannot transfer a program.

## Direct transfer in Chrome or Edge

1. Confirm that the selected board matches your hardware.
2. Select **Connect Device**.
3. Select the Circuit Playground in the browser's device chooser and approve
   the connection.
4. The primary button changes to **Send to Board**. Select it whenever you want
   to build the program and transfer it directly.

Circuit Playground Express uses WebUSB while the application is running and in
the current Adafruit bootloader. Older bootloaders still support manual UF2
copying but lack the stable WebUSB identity needed for automatic reconnect. If
an Express cannot reconnect during transfer, use the optional
[one-time official bootloader setup](/device/express-bootloader).

Circuit Playground Bluefruit uses its direct HF2 USB interface in both modes
after its optional [one-time direct-transfer setup](/device/bluefruit-bootloader).
The stock Adafruit bootloader still supports manual UF2 copying but does not
provide the HF2 interface this editor needs for direct transfer.

If pairing or direct transfer fails, MakeCode asks whether to try again,
download the UF2 for manual copying, or cancel. It does not silently download a
UF2. The same dialog contains troubleshooting tips and, on desktop Linux, the
one-time device-permission setup.

## Desktop Linux permissions

Chrome and Edge on desktop Linux normally need a one-time udev rule before
they can open these boards. If connecting fails, select **Troubleshooting tips
for Linux** in the failure dialog, then download the product-specific rules
file. Run:

```sh
sudo install -m 0644 "$HOME/Downloads/60-circuit-playground-webusb.rules" \
    /etc/udev/rules.d/60-circuit-playground-webusb.rules
sudo udevadm control --reload-rules
sudo udevadm trigger --action=add --subsystem-match=usb
sudo udevadm trigger --action=add --subsystem-match=hidraw
```

Reconnect the board and choose **Connect Device** again. ChromeOS, macOS, and
Windows do not use this udev file. ChromeOS handles device-node access through
its system permission broker, although the first browser chooser is still
required.

## Copy a UF2 manually

1. In MakeCode, confirm that the selected board matches your hardware.
2. Open the **...** menu beside **Download** and select **Download as File**.
3. Put the board in bootloader mode. If its bootloader drive is not already
   visible, press the board's reset button twice in quick succession.
4. Copy the downloaded `.uf2` file to the bootloader drive.
5. Wait for the copy to finish. The drive normally disconnects and the new
   program starts automatically.

The Express bootloader drive is named `CPLAYBOOT`; the Bluefruit bootloader
drive is named `CPLAYBTBOOT`.

UF2 download works without WebUSB and is the supported fallback in Firefox.
It also remains the recovery path if direct upload is unavailable.

## If the bootloader drive does not appear

Try another USB port and a known data cable, disconnect battery power, and
double-press reset again. A slowly pulsing or colored bootloader status LED is
normal; its exact pattern depends on the installed bootloader version.

Do not copy a Circuit Playground Express UF2 to Circuit Playground Bluefruit,
or a Bluefruit UF2 to an Express. Return to the editor, select the correct
board, and download again.
