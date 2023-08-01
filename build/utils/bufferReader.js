"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferWriter = exports.BufferReader = void 0;
class BufferReader {
    buffer;
    pos;
    constructor(buffer) {
        this.buffer = buffer;
        this.pos = 0;
    }
    readUInt8() {
        this.pos++;
        return this.buffer.readUInt8(this.pos - 1);
    }
    readUInt16() {
        this.pos += 2;
        return this.buffer.readUInt8(this.pos - 2);
    }
    readUInt32() {
        this.pos += 4;
        return this.buffer.readUInt8(this.pos - 4);
    }
}
exports.BufferReader = BufferReader;
class BufferWriter {
    buffer;
    offset;
    constructor(size) {
        this.buffer = Buffer.alloc(size);
        this.offset = 0;
    }
    writeUInt8(num) {
        this.offset += 1;
        this.buffer.writeUInt8(num, this.offset - 1);
    }
    writeUInt16(num) {
        this.offset += 2;
        this.buffer.writeUInt16LE(num, this.offset - 2);
    }
    writeUInt32(num) {
        this.offset += 4;
        this.buffer.writeUInt32LE(num, this.offset - 4);
    }
    write(bytes) {
        bytes.copy(this.buffer, this.offset, 0, bytes.length);
        this.offset += bytes.length;
    }
    toBuffer() {
        return this.buffer;
    }
}
exports.BufferWriter = BufferWriter;
