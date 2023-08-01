"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressStringBinary = exports.compressString = exports.validateFloat = exports.validateInt = exports.isInt = exports.validateRange = void 0;
function validateRange(num, min, max) {
    if (num < min || num > max)
        throw new Error(`Number (${num})out of range: [${min}, ${max}]`);
}
exports.validateRange = validateRange;
function isInt(num) {
    return Number.isInteger(num) === true;
}
exports.isInt = isInt;
function validateInt(num) {
    if (!Number.isInteger(num) || Number.isNaN(num) || !Number.isFinite(num))
        throw new Error('Invalid Int: ' + num);
}
exports.validateInt = validateInt;
function validateFloat(num) {
    if (Number.isNaN(num) || Number.isInteger(num) || !Number.isFinite(num))
        throw 'Invalid Float: ' + num;
}
exports.validateFloat = validateFloat;
function compressString(str, asArray = false) {
    asArray = (asArray === true);
    var i, dictionary = {}, uncompressed = str, c, wc, w = "", result = [], ASCII = '', dictSize = 256;
    for (i = 0; i < 256; i += 1) {
        dictionary[String.fromCharCode(i)] = i;
    }
    for (i = 0; i < uncompressed.length; i += 1) {
        c = uncompressed.charAt(i);
        wc = w + c;
        //Do not use dictionary[wc] because javascript arrays
        //will return values for array['pop'], array['push'] etc
        // if (dictionary[wc]) {
        if (dictionary.hasOwnProperty(wc)) {
            w = wc;
        }
        else {
            result.push(dictionary[w]);
            ASCII += String.fromCharCode(dictionary[w]);
            // Add wc to the dictionary.
            dictionary[wc] = dictSize++;
            w = String(c);
        }
    }
    // Output the code for w.
    if (w !== "") {
        result.push(dictionary[w]);
        ASCII += String.fromCharCode(dictionary[w]);
    }
    return ASCII;
}
exports.compressString = compressString;
;
function compressStringBinary(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i = 1; i < data.length; i++) {
        currChar = data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase = currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    return Buffer.from(new Uint8Array(out)).toString("base64");
}
exports.compressStringBinary = compressStringBinary;
