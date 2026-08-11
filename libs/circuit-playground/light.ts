namespace light {
    /**
     * Show a pattern of colors on the ten-pixel Circuit Playground ring.
     * @param colors a string describing the colors, eg: "red red red red red red red red red red"
     * @param interval the duration in milliseconds between frames, eg: 400
     */
    //% blockId="neopixel_show_ring_colors" block="show ring |%colors"
    //% weight=100
    //% help="light/show-ring"
    //% colors.fieldEditor="lights"
    //% colors.fieldOptions.onParentBlock=true
    //% colors.fieldOptions.decompileLiterals=true
    //% blockExternalInputs="true" blockGap=8
    export function showRing(colors: string, interval: number = 400) {
        return light.pixels.showColors(colors, interval);
    }
}
