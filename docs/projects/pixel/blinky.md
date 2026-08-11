# Set Color

Set the color of all ten pixels on the onboard light ring.

```blocks
forever(function() {
    light.setAll(0xff0000)
    pause(100)
    light.setAll(0x007fff)
    pause(100)
})
```
