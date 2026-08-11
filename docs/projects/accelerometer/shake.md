# Shake

Use an accelerometer to detect when the device is shaken.

```blocks
input.onGesture(Gesture.Shake, function() {
    pins.A1.digitalWrite(true);
    pause(500);
    pins.A1.digitalWrite(false);
})
```

```config
feature=uf2
feature=accelerometer
feature=pina1
```

```package
accelerometer
```
