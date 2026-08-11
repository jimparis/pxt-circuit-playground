input.buttonA.onEvent(ButtonEvent.Click, function () {
    pins.A1.digitalWrite(true)
    pause(20)
    pins.A1.digitalWrite(false)
})

input.onGesture(Gesture.Shake, function () {
    light.showRing("red orange yellow green blue indigo violet purple white black")
})

const ambient = input.ambientColor()
const temperature = input.temperature(TemperatureUnit.Celsius)
const brightness = input.lightLevel()
const loudness = input.soundLevel()
const switchIsRight = input.switchRight()
console.logValue("color", ambient)
console.logValue("temperature", temperature)
console.logValue("brightness", brightness)
console.logValue("loudness", loudness)
console.logValue("switch", switchIsRight ? 1 : 0)

music.playTone(440, 20)
