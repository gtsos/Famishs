"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotateRight8Bit = exports.rotateLeft8Bit = exports.decode = void 0;
function declude32w(val, bits) {
    return (val >>> bits) | (val << (32 - bits));
}
;
function shiftBit32(val, bits) {
    return (val << bits) | (val >>> (32 - bits));
}
function decode(arr) {
    let xor = 5;
    let addr = 6;
    let rem = 311;
    let mul = 10;
    //should fix error//
    if (!(typeof arr == 'object'))
        return [];
    let data = [...arr];
    let byteOffset = data[data.length - 1];
    for (let i = 0; i < data.length - 1; i++) {
        data[i] -= byteOffset;
        data[i] ^= xor;
        xor = ((xor + addr) * mul) % rem;
    }
    let fstmptArray = [];
    for (let i = 0; i < data.length - 1; i++) {
        fstmptArray.push(data[i]);
    }
    return fstmptArray;
}
exports.decode = decode;
const rotationKey = 5;
function rotateLeft8Bit(number, bits = rotationKey) {
    const mask = 0xFF;
    number &= mask;
    bits %= 8;
    return ((number << bits) | (number >> (8 - bits))) & mask;
}
exports.rotateLeft8Bit = rotateLeft8Bit;
function rotateRight8Bit(number, bits = rotationKey) {
    const mask = 0xFF;
    number &= mask;
    bits %= 8;
    return ((number >> bits) | (number << (8 - bits))) & mask;
}
exports.rotateRight8Bit = rotateRight8Bit;
