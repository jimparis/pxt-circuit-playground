# Button

## Introduction @unplugged

Use the built-in A button to control an LED connected to pin A1.

![A breadboard with a button that turns on an LED](/static/projects/digital-io/button-led/gallery.gif)

## Step 1 @fullscreen

Add a ``||input:on event||`` to handle a click on built-in **button A**.

```blocks
input.buttonA.onEvent(ButtonEvent.Click, function () {
})
```

## Step 2 @fullscreen

Add ``||pins:digital write||`` to set pin **A1** HIGH when button A is clicked.

```blocks
input.buttonA.onEvent(ButtonEvent.Click, function () {
    pins.A1.digitalWrite(true)
})
```

## Step 3 @fullscreen

Look at the simulator and notice that a breadboard and a button has been added to the board.
Try pressing on the button and the LED should light up.

![A simulated boardboard turning on a LED](/static/projects/digital-io/button-led/led-on.gif)

## Step 4 @fullscreen

Add ``||loops:pause||`` to wait some time, then another ``||pins:digital write||`` to 
turn pin **A1** to low.

```blocks
input.buttonA.onEvent(ButtonEvent.Click, function () {
    pins.A1.digitalWrite(true)
    pause(1000)
    pins.A1.digitalWrite(false)
})
```

## Step 5 @fullscreen

Try your program in the simulator. If it works as expected, click on the ``|Download|`` button
and follow the instructions to get it on your board.

## Step 6 @fullscreen

Click on the **wrench** icon under the simulator to print detailed breadboard wiring instructions.

![Wrench icon](/static/projects/digital-io/button-led/wrench.png)

```config
feature=uf2
feature=pina1
```
