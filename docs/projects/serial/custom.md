# Custom

Attach a serial device to different pins.

```typescript
const ser = serial.createSerial(pins.A2, pins.A1);
forever(function () {
	ser.writeLine("hello")
    pause(500)
})

```

```package
serial
```
