export class BufferReader {
    private buffer: Buffer;
    private pos: number;

    public constructor(buffer: Buffer) {
        this.buffer = buffer;
        this.pos = 0;
    }

    public readUInt8() {
        this.pos++;
        return this.buffer.readUInt8(this.pos - 1);
    }

    public readUInt16() {
        this.pos += 2;
        return this.buffer.readUInt8(this.pos - 2);
    }

    public readUInt32() {
        this.pos += 4;
        return this.buffer.readUInt8(this.pos - 4);
    }
}

export class BufferWriter {
    private buffer: Buffer;
    private offset: number;

    public constructor(size: number) {
        this.buffer = Buffer.alloc(size);
        this.offset = 0;
    }

    public writeUInt8(num: number) {
        this.offset += 1;
        this.buffer.writeUInt8(num, this.offset - 1);
    }

    public writeUInt16(num: number) { 
        this.offset += 2;
        this.buffer.writeUInt16LE(num, this.offset - 2);
    }

    public writeUInt32(num: number) {
        this.offset += 4;
        this.buffer.writeUInt32LE(num, this.offset - 4);
    }

  
    public write(bytes: Buffer) {
        bytes.copy(this.buffer, this.offset, 0, bytes.length);
        this.offset += bytes.length;
    }

    public toBuffer(): Buffer {
        return this.buffer;
    }
}
