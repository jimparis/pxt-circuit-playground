# Multi Blinky

You can have multiple forever loops running concurrently to blink multiple LEDs.

```blocks
forever(function() {
    pins.A1.digitalWrite(false)
    pause(100)
    pins.A1.digitalWrite(true)
    pause(100)    
})
forever(function() {
    pins.A2.digitalWrite(false)
    pause(500)
    pins.A2.digitalWrite(true)
    pause(500)    
})
```

```config
feature=uf2
feature=pina1
feature=pina2
```
