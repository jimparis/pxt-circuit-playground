/// <reference path="../node_modules/pxt-core/localtypings/pxteditor.d.ts" />
/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts" />

import { FieldLights } from "./field_lights";

pxt.editor.initFieldExtensionsAsync = function (_opts: pxt.editor.FieldExtensionOptions): Promise<pxt.editor.FieldExtensionResult> {
    pxt.debug("loading Circuit Playground field editors...");
    return Promise.resolve({
        fieldEditors: [{ selector: "lights", editor: FieldLights }]
    });
};
