namespace input {
    /**
     * Estimate the ambient color by illuminating the surface next to the light
     * sensor with red, green, and blue light in turn.
     */
    //% help=input/ambient-color
    //% blockId=device_get_ambient_color block="ambient color"
    //% parts="rgbsensor"
    //% weight=29 blockGap=8
    export function ambientColor(): number {
        const settleTime = 100;
        const sensorPixel = 1;
        const strip = light.pixels;
        const oldBrightness = strip.brightness();
        const oldColor = strip.pixelColor(sensorPixel);
        const oldBuffered = strip.buffered();

        strip.setBuffered(true);
        strip.setBrightness(255);

        strip.setPixelColor(sensorPixel, Colors.Red);
        strip.show();
        pause(settleTime);
        const red = input.lightLevel();

        strip.setPixelColor(sensorPixel, Colors.Green);
        strip.show();
        pause(settleTime);
        const green = input.lightLevel();

        strip.setPixelColor(sensorPixel, Colors.Blue);
        strip.show();
        pause(settleTime);
        const blue = input.lightLevel();

        strip.setBrightness(oldBrightness);
        strip.setPixelColor(sensorPixel, oldColor);
        strip.show();
        strip.setBuffered(oldBuffered);

        let closest = Colors.White;
        let closestDistance = -1;
        const colors = [
            Colors.Red,
            Colors.Green,
            Colors.Blue,
            Colors.Yellow,
            Colors.White
        ];

        for (let i = 0; i < colors.length; ++i) {
            const color = colors[i];
            const redDistance = red - ((color >> 16) & 0xff);
            const greenDistance = green - ((color >> 8) & 0xff);
            const blueDistance = blue - (color & 0xff);
            const distance = redDistance * redDistance
                + greenDistance * greenDistance
                + blueDistance * blueDistance;
            if (closestDistance < 0 || distance < closestDistance) {
                closestDistance = distance;
                closest = color;
            }
        }

        return closest;
    }
}
