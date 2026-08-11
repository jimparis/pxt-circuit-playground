# Piano Buttons

```blocks
input.buttonA.onEvent(ButtonEvent.Click, function () {
    music.playTone(262, music.beat(BeatFraction.Half))
})
input.buttonB.onEvent(ButtonEvent.Click, function () {
    music.playTone(294, music.beat(BeatFraction.Half))
})
```

```config
feature=uf2
feature=music
```
