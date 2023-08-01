
function declude32w(val: any, bits: any) {
    return (val >>> bits) | (val << (32 - bits));
};

function shiftBit32(val: any, bits: any) {
    return (val << bits) | (val >>> (32 - bits));
}

export function decode(arr: any) {
    let xor = 5;
    let addr = 6;
    let rem = 311;
    let mul = 10;
    
    //should fix error//
    if(!(typeof arr == 'object')) return [];

    let data = [...arr];
    let byteOffset = data[data.length - 1];
    
    for (let i = 0; i < data.length - 1; i++) {
        data[i] -= byteOffset;
        data[i] ^= xor;
        xor = ((xor + addr) * mul) % rem;
    }

    let fstmptArray = [];

    for(let i = 0; i < data.length - 1; i++) {
        fstmptArray.push(data[i]);
    }
    return fstmptArray;
}

const rotationKey = 5;
export function rotateLeft8Bit(number:any, bits:any = rotationKey) {
    const mask = 0xFF;
    number &= mask;
    bits %= 8;
  
    return ((number << bits) | (number >> (8 - bits))) & mask;
}
  
export function rotateRight8Bit(number:any, bits:any = rotationKey) {
    const mask = 0xFF;
    number &= mask;
    bits %= 8;
  
    return ((number >> bits) | (number << (8 - bits))) & mask;
}