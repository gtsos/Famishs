"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompiler = exports.lol = void 0;
const terser_1 = require("terser");
function lol(code) {
    return __awaiter(this, void 0, void 0, function* () {
        let minifiedCode = yield (0, terser_1.minify)(code, {
            mangle: {
                properties: true,
                // @ts-ignore
                reserved: ['_$EXPORTS', /require/],
                toplevel: true,
            },
            compress: {
                passes: 20,
            },
            format: {
                ecma: 2020,
            },
            ecma: 2020,
        });
        console.log(minifiedCode);
    });
}
exports.lol = lol;
lol(`
const str = Math.random() ? "require" : "require";
let obj = {};
obj[str] =  10;
console.log(obj);
`);
function getCompiler(opCodes, bytecode, usedOpCodes) {
    return __awaiter(this, void 0, void 0, function* () {
        let code = `(function () {
        'use strict';
    
        
        const OpCode = ${JSON.stringify(opCodes)};
    
        const string = '083116114105110103';
        const fromCharCod = '102114111109067104097114067111100101';
        
        /**
         * Some proto encalls
         */
        function getWindowProto () {
            return this;
        }
    
        function base10Decode (encodedInput) {
            let result = '';
            
            for (let i = 0; i < encodedInput.length; i += 3) {
              const charCode = parseInt(encodedInput.substr(i, 3), 10);
              result += String.fromCharCode(charCode);
            }
            
            return result;
        }
        function getPropInsideWindow() {
            return getWindowProto()[base10Decode(arguments[0])];
        }
        function arrayWithFunctions () {
            return [getPropInsideWindow, base10Decode, getWindowProto];
        }
        function hookUnsignedString() {
            return getPropInsideWindow(string)[base10Decode(fromCharCod)]
        }
    
        var TINF_OK = 0;
        var TINF_DATA_ERROR = -3;
        function Tree() {
            this.$table = new Uint16Array(16); /* table of code length counts */
            this.trans = new Uint16Array(288); /* code -> symbol translation table */
        }
        function Data(source, dest) {
            this.$source = source;
            this.$sourceIndex = 0;
            this.$tag = 0;
            this.bitcount = 0;
            this.dest = dest;
            this.destLen = 0;
            this.ltree = new Tree(); /* dynamic length/symbol tree */
            this.dtree = new Tree(); /* dynamic distance tree */
        }
        /* --------------------------------------------------- *
         * -- uninitialized global data (static structures) -- *
         * --------------------------------------------------- */
        var sltree = new Tree();
        var sdtree = new Tree();
        /* extra bits and base tables for length codes */
        var length_bits = new Uint8Array(30);
        var length_base = new Uint16Array(30);
        /* extra bits and base tables for distance codes */
        var dist_bits = new Uint8Array(30);
        var dist_base = new Uint16Array(30);
        /* special ordering of code length codes */
        var clcidx = new Uint8Array([
            16, 17, 18, 0, 8, 7, 9, 6,
            10, 5, 11, 4, 12, 3, 13, 2,
            14, 1, 15
        ]);
    
        /* used by tinf_decode_trees, avoids allocations every call */
        var code_tree = new Tree();
        var lengths = new Uint8Array(288 + 32);
        /* ----------------------- *
         * -- utility functions -- *
         * ----------------------- */
        /* build extra bits and base tables */
        function tinf_build_bits_base(bits, base, delta, first) {
            var i, sum;
            /* build bits table */
            for (i = 0; i < delta; ++i)
                bits[i] = 0;
            for (i = 0; i < 30 - delta; ++i)
                bits[i + delta] = i / delta | 0;
            /* build base table */
            for (sum = first, i = 0; i < 30; ++i) {
                base[i] = sum;
                sum += 1 << bits[i];
            }
        }
        /* build the fixed huffman trees */
        function tinf_build_fixed_trees(lt, dt) {
            var i;
            /* build fixed length tree */
            for (i = 0; i < 7; ++i)
                lt.$table[i] = 0;
            lt.$table[7] = 24;
            lt.$table[8] = 152;
            lt.$table[9] = 112;
            for (i = 0; i < 24; ++i)
                lt.trans[i] = 256 + i;
            for (i = 0; i < 144; ++i)
                lt.trans[24 + i] = i;
            for (i = 0; i < 8; ++i)
                lt.trans[24 + 144 + i] = 280 + i;
            for (i = 0; i < 112; ++i)
                lt.trans[24 + 144 + 8 + i] = 144 + i;
            /* build fixed distance tree */
            for (i = 0; i < 5; ++i)
                dt.$table[i] = 0;
            dt.$table[5] = 32;
            for (i = 0; i < 32; ++i)
                dt.trans[i] = i;
        }
        /* given an array of code lengths, build a tree */
        var offs = new Uint16Array(16);
        function tinf_build_tree(t, lengths, off, num) {
            var i, sum;
            /* clear code length count table */
            for (i = 0; i < 16; ++i)
                t.$table[i] = 0;
            /* scan symbol lengths, and sum code length counts */
            for (i = 0; i < num; ++i)
                t.$table[lengths[off + i]]++;
            t.$table[0] = 0;
            /* compute offset table for distribution sort */
            for (sum = 0, i = 0; i < 16; ++i) {
                offs[i] = sum;
                sum += t.$table[i];
            }
            /* create code->symbol translation table (symbols sorted by code) */
            for (i = 0; i < num; ++i) {
                if (lengths[off + i])
                    t.trans[offs[lengths[off + i]]++] = i;
            }
        }
        /* ---------------------- *
         * -- decode functions -- *
         * ---------------------- */
        /* get one bit from source stream */
        function tinf_getbit(d) {
            /* check if tag is empty */
            if (!d.bitcount--) {
                /* load next tag */
                d.$tag = d.$source[d.$sourceIndex++];
                d.bitcount = 7;
            }
            /* shift bit out of tag */
            var bit = d.$tag & 1;
            d.$tag >>>= 1;
            return bit;
        }
        /* read a num bit value from a stream and add base */
        function tinf_read_bits(d, num, base) {
            if (!num)
                return base;
            while (d.bitcount < 24) {
                d.$tag |= d.$source[d.$sourceIndex++] << d.bitcount;
                d.bitcount += 8;
            }
            var val = d.$tag & (0xffff >>> (16 - num));
            d.$tag >>>= num;
            d.bitcount -= num;
            return val + base;
        }
        /* given a data stream and a tree, decode a symbol */
        function tinf_decode_symbol(d, t) {
            while (d.bitcount < 24) {
                d.$tag |= d.$source[d.$sourceIndex++] << d.bitcount;
                d.bitcount += 8;
            }
            var sum = 0, cur = 0, len = 0;
            var tag = d.$tag;
            /* get more bits while code value is above sum */
            do {
                cur = 2 * cur + (tag & 1);
                tag >>>= 1;
                ++len;
                sum += t.$table[len];
                cur -= t.$table[len];
            } while (cur >= 0);
            d.$tag = tag;
            d.bitcount -= len;
            return t.trans[sum + cur];
        }
        /* given a data stream, decode dynamic trees from it */
        function tinf_decode_trees(d, lt, dt) {
            var hlit, hdist, hclen;
            var i, num, length;
            /* get 5 bits HLIT (257-286) */
            hlit = tinf_read_bits(d, 5, 257);
            /* get 5 bits HDIST (1-32) */
            hdist = tinf_read_bits(d, 5, 1);
            /* get 4 bits HCLEN (4-19) */
            hclen = tinf_read_bits(d, 4, 4);
            for (i = 0; i < 19; ++i)
                lengths[i] = 0;
            /* read code lengths for code length alphabet */
            for (i = 0; i < hclen; ++i) {
                /* get 3 bits code length (0-7) */
                var clen = tinf_read_bits(d, 3, 0);
                lengths[clcidx[i]] = clen;
            }
            /* build code length tree */
            tinf_build_tree(code_tree, lengths, 0, 19);
            /* decode code lengths for the dynamic trees */
            for (num = 0; num < hlit + hdist;) {
                var sym = tinf_decode_symbol(d, code_tree);
                switch (sym) {
                    case 16:
                        /* copy previous code length 3-6 times (read 2 bits) */
                        var prev = lengths[num - 1];
                        for (length = tinf_read_bits(d, 2, 3); length; --length) {
                            lengths[num++] = prev;
                        }
                        break;
                    case 17:
                        /* repeat code length 0 for 3-10 times (read 3 bits) */
                        for (length = tinf_read_bits(d, 3, 3); length; --length) {
                            lengths[num++] = 0;
                        }
                        break;
                    case 18:
                        /* repeat code length 0 for 11-138 times (read 7 bits) */
                        for (length = tinf_read_bits(d, 7, 11); length; --length) {
                            lengths[num++] = 0;
                        }
                        break;
                    default:
                        /* values 0-15 represent the actual code lengths */
                        lengths[num++] = sym;
                        break;
                }
            }
            /* build dynamic trees */
            tinf_build_tree(lt, lengths, 0, hlit);
            tinf_build_tree(dt, lengths, hlit, hdist);
        }
        /* ----------------------------- *
         * -- block inflate functions -- *
         * ----------------------------- */
        /* given a stream and two trees, inflate a block of data */
        function tinf_inflate_block_data(d, lt, dt) {
            while (1) {
                var sym = tinf_decode_symbol(d, lt);
                /* check for end of block */
                if (sym === 256) {
                    return TINF_OK;
                }
                if (sym < 256) {
                    d.dest[d.destLen++] = sym;
                }
                else {
                    var length, dist, offs;
                    var i;
                    sym -= 257;
                    /* possibly get more bits from length code */
                    length = tinf_read_bits(d, length_bits[sym], length_base[sym]);
                    dist = tinf_decode_symbol(d, dt);
                    /* possibly get more bits from distance code */
                    offs = d.destLen - tinf_read_bits(d, dist_bits[dist], dist_base[dist]);
                    /* copy match */
                    for (i = offs; i < offs + length; ++i) {
                        d.dest[d.destLen++] = d.dest[i];
                    }
                }
            }
        }
        /* inflate an uncompressed block of data */
        function tinf_inflate_uncompressed_block(d) {
            var length, invlength;
            var i;
            /* unread from bitbuffer */
            while (d.bitcount > 8) {
                d.$sourceIndex--;
                d.bitcount -= 8;
            }
            /* get length */
            length = d.$source[d.$sourceIndex + 1];
            length = 256 * length + d.$source[d.$sourceIndex];
            /* get one's complement of length */
            invlength = d.$source[d.$sourceIndex + 3];
            invlength = 256 * invlength + d.$source[d.$sourceIndex + 2];
            /* check length */
            if (length !== (~invlength & 0x0000ffff))
                return TINF_DATA_ERROR;
            d.$sourceIndex += 4;
            /* copy block */
            for (i = length; i; --i)
                d.dest[d.destLen++] = d.$source[d.$sourceIndex++];
            /* make sure we start next block on a byte boundary */
            d.bitcount = 0;
            return TINF_OK;
        }
        /* inflate stream from source to dest */
        function tinf_uncompress(source, dest) {
            var d = new Data(source, dest);
            var bfinal, btype, res;
            do {
                /* read final block flag */
                bfinal = tinf_getbit(d);
                /* read block type (2 bits) */
                btype = tinf_read_bits(d, 2, 0);
                /* decompress block */
                switch (btype) {
                    case 0:
                        /* decompress uncompressed block */
                        res = tinf_inflate_uncompressed_block(d);
                        break;
                    case 1:
                        /* decompress block with fixed huffman trees */
                        res = tinf_inflate_block_data(d, sltree, sdtree);
                        break;
                    case 2:
                        /* decompress block with dynamic huffman trees */
                        tinf_decode_trees(d, d.ltree, d.dtree);
                        res = tinf_inflate_block_data(d, d.ltree, d.dtree);
                        break;
                    default:
                        res = TINF_DATA_ERROR;
                }
                if (res !== TINF_OK)
                    throw new Error('Data error');
            } while (!bfinal);
            if (d.destLen < d.dest.length) {
                if (typeof d.dest.slice === 'function')
                    return d.dest.slice(0, d.destLen);
                else
                    return d.dest.subarray(0, d.destLen);
            }
            return d.dest;
        }
    
        /* -------------------- *
         * -- initialization -- *
         * -------------------- */
        /* build fixed huffman trees */
        tinf_build_fixed_trees(sltree, sdtree);
        /* build extra bits and base tables */
        tinf_build_bits_base(length_bits, length_base, 4, 3);
        tinf_build_bits_base(dist_bits, dist_base, 2, 1);
        /* fix a special case */
        length_bits[28] = 0;
        length_base[28] = 258;
    
    
        function b64ToUint6(nChr) {
            return nChr > 64 && nChr < 91
                ? nChr - 65
                : nChr > 96 && nChr < 123
                    ? nChr - 71
                    : nChr > 47 && nChr < 58
                        ? nChr + 4
                        : nChr === 43
                            ? 62
                            : nChr === 47
                                ? 63
                                : 0;
        }
        function base64ToUint8(sBase64, nBlocksSize = 0) {
            var sB64Enc = sBase64.replace(/[^A-Za-z0-9+/]/g, ""), nInLen = sB64Enc.length, nOutLen = nBlocksSize
                ? Math.ceil(((nInLen * 3 + 1) >> 2) / nBlocksSize) * nBlocksSize
                : (nInLen * 3 + 1) >> 2, taBytes = new Uint8Array(nOutLen);
            const FIRST_BYTE_OFFSET = 0;
            for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = FIRST_BYTE_OFFSET; nInIdx < nInLen; nInIdx++) {
                nMod4 = nInIdx & 3;
                nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << (6 * (3 - nMod4));
                if (nMod4 === 3 || nInLen - nInIdx === 1) {
                    for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                        taBytes[nOutIdx] = ((nUint24 >>> ((16 >>> nMod3) & 24)) & 255);
                    }
                    nUint24 = 0;
                }
            }
            return taBytes;
        }
    
    
        function _eval(instructions, imports = {}) {
            const global_scope = typeof globalThis != "undefined" ? globalThis : (typeof window != "undefined" ? window : imports);
            let scope = global_scope;
            const _require = typeof (require) != "undefined" ? require : null;
            const data = base64ToUint8(instructions);
            const compressed = !!data[0];
            const size = compressed ? ((data[1]) | (data[2] << 8) | (data[3] << 16) | (data[4] << 24)) : data.length;
            const bytes = compressed ? new Uint8Array(size) : new Uint8Array(data.buffer, 5, data.length - 5);
            if (compressed)
                tinf_uncompress(new Uint8Array(data.buffer, 5, data.length - 5), bytes);
            let offset = 0;
            let scope_data = {};
            let registers = [];
            const strings = [];
            const stack = [];
            const exports = {};
            const parent_scope_ids = [];
            let current_scope_id = 0;
            let current_fn_ref = null;
            let args = null;
            let tryCatches = [];
            let caughtError = null;
            imports._$EXPORTS = exports;
            if(_require) imports.require = _require;
            const return_register = 0;
            const _F64 = new Float64Array(1);
            const _U8 = new Uint8Array(_F64.buffer);
            function readF64() {
                _U8[0] = bytes[offset++];
                _U8[1] = bytes[offset++];
                _U8[2] = bytes[offset++];
                _U8[3] = bytes[offset++];
                _U8[4] = bytes[offset++];
                _U8[5] = bytes[offset++];
                _U8[6] = bytes[offset++];
                _U8[7] = bytes[offset++];
                return _F64[0];
            }
            function readUnsignedLEB128() {
                let result = 0;
                let shift = 0;
                let byte = 0;
                while (true) {
                    byte = bytes[offset++];
                    result |= (byte & 0x7f) << shift;
                    if ((byte & 0x80) == 0)
                        break;
                    shift += 7;
                }
                return result;
            }
            
            function readU32() {
                return bytes[offset++] | (bytes[offset++] << 8) | (bytes[offset++] << 16) | (bytes[offset++] << 24);
            }
            function readString() {
                const len = readUnsignedLEB128();
                let str = '';
                for (let i = 0; i < len; i++)
                    str += hookUnsignedString()(readUnsignedLEB128());
                return str;
            }
            function fakeOne() {
                const len = readUnsignedLEB128();
                let str = '';
                for (let i = 0; i < len; i++)
                    str += hookUnsignedString()(readUnsignedLEB128());
                return str;
            }
            function useless3() {
                return String.fromCharCode;
            }
            function create_func(scope_id, exec_offset) {
                const parent_scope = scope_data;
                return function self_fn() {
                    const last_scope_id = current_scope_id;
                    const new_scope_data = {};
                    current_scope_id = scope_id;
                    const old_scope_data = scope_data;
                    scope_data = new_scope_data;
                    scope_data[scope_id] = {};
                    // get all parent scope id's
                    const parent_ids = parent_scope_ids[scope_id];
                    const len = parent_ids.length;
                    // make a custom reference to each scope
                    for (let i = 0; i < len; i++) {
                        const scope_id = parent_ids[i];
                        let scope = parent_scope[scope_id];
                        new_scope_data[scope_id] = scope;
                    }
                    // save previous state
                    const old_registers = registers;
                    const old_offset = offset;
                    const old_self = current_fn_ref;
                    const old_args = args;
                    const old_scope = scope;
                    const old_try = tryCatches;
                    let ret = null;
                    let err = null;
                    registers = [];
                    tryCatches = [];
                    offset = exec_offset;
                    current_fn_ref = self_fn;
                    args = arguments;
                    scope = this;
                    try {
                        ret = run();
                    }
                    catch (e) {
                        if (tryCatches.length) {
                            const jmpTo = tryCatches.pop();
                            offset = jmpTo;
                            caughtError = e;
                            ret = run();
                        }
                        else {
                            err = e;
                        }
                    }
                    // restore previous execution state
                    tryCatches = old_try;
                    offset = old_offset;
                    const regCopy = registers;
                    registers = old_registers;
                    current_fn_ref = old_self;
                    scope_data = old_scope_data;
                    current_scope_id = last_scope_id;
                    args = old_args;
                    scope = old_scope;
                    // if an error occured during execution, throw it
                    if (err)
                        throw err;
    
                    return ret;
                };
            }
            function run() {
                for (;;) {
                    const op_code = bytes[offset++];
                    switch (op_code) {
                        case OpCode.SELF_FN_REF: {
                            const var_id = readUnsignedLEB128();
                            const scope_id = readUnsignedLEB128();
                            Object.defineProperty(scope_data[scope_id], var_id, {
                                get() { return current_fn_ref; },
                                set() { },
                            });
                            break;
                        }
                        case OpCode.ARGUMENTS_REF: {
                            {
                                scope_data[current_scope_id][readUnsignedLEB128()] = args;
                            }
                            break;
                        }
                        case OpCode.INSTANCE_OF: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] instanceof registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.IN: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] in registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.LOAD_INT: {
                            {
                                registers[bytes[offset++]] = readUnsignedLEB128();
                            }
                            break;
                        }
                        case OpCode.PLUS_PLUS: {
                            {
                                registers[bytes[offset++]] = bytes[offset++] ? ++scope_data[readUnsignedLEB128()][readUnsignedLEB128()] : scope_data[readUnsignedLEB128()][readUnsignedLEB128()]++;
                            }
                            break;
                        }
                        case OpCode.MINUS_MINUS: {
                            {
                                registers[bytes[offset++]] = bytes[offset++] ? --scope_data[readUnsignedLEB128()][readUnsignedLEB128()] : scope_data[readUnsignedLEB128()][readUnsignedLEB128()]--;
                            }
                            break;
                        }
                        case OpCode.LOAD_F64: {
                            {
                                registers[bytes[offset++]] = readF64();
                            }
                            break;
                        }
                        case OpCode.MOV_ARG_TO_VAR: {
                            const arg_index = readUnsignedLEB128();
                            const var_id = readUnsignedLEB128();
                            scope_data[current_scope_id][var_id] = args[arg_index];
                            break;
                        }
                        case OpCode.MOVE_REG: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.THIS: {
                            {
                                registers[bytes[offset++]] = scope;
                            }
                            break;
                        }
                        case OpCode.CREATE_FUNC: {
                            {
                                registers[bytes[offset++]] = create_func(readUnsignedLEB128(), readU32());
                            }
                            break;
                        }
                        case OpCode.OBJECT_PLUS_PLUS: {
                            {
                                registers[bytes[offset++]] = bytes[offset++] ? ++registers[bytes[offset++]][registers[bytes[offset++]]] : registers[bytes[offset++]][registers[bytes[offset++]]]++;
                            }
                            break;
                        }
                        case OpCode.OBJECT_MINUS_MINUS: {
                            {
                                registers[bytes[offset++]] = bytes[offset++] ? --registers[bytes[offset++]][registers[bytes[offset++]]] : registers[bytes[offset++]][registers[bytes[offset++]]]--;
                            }
                            break;
                        }
                        case OpCode.LOAD_STR: {
                            {
                                registers[bytes[offset++]] = strings[readUnsignedLEB128()];
                            }
                            break;
                        }
                        case OpCode.LOAD_REGEX: {
                            {
                                registers[bytes[offset++]] = new RegExp(strings[readUnsignedLEB128()], strings[readUnsignedLEB128()]);
                            }
                            break;
                        }
                        case OpCode.UNARY_NOT: {
                            {
                                registers[bytes[offset++]] = !registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.UNARY_PLUS: {
                            {
                                registers[bytes[offset++]] = +registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.UNARY_VOID: {
                            {
                                registers[bytes[offset++]] = void registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.UNARY_INVERT: {
                            {
                                registers[bytes[offset++]] = ~registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.UNARY_NEGATE: {
                            {
                                registers[bytes[offset++]] = -registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.UNARY_TYPEOF: {
                            {
                                registers[bytes[offset++]] = typeof (registers[bytes[offset++]]);
                            }
                            break;
                        }
                        case OpCode.UNARY_DELETE: {
                            {
                                registers[bytes[offset++]] = delete (registers[bytes[offset++]]);
                            }
                            break;
                        }
                        case OpCode.UNARY_DELETE_MEMBER_EXPRESSION: {
                            {
                                registers[bytes[offset++]] = delete (registers[bytes[offset++]][registers[bytes[offset++]]]);
                            }
                            break;
                        }
                        case OpCode.ADD: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] + registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.DIVIDE: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] / registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.SUB: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] - registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.BIT_XOR: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] ^ registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.PIPE: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] | registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.BIT_SHIFT_RIGHT_ZERO_FILL: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] >>> registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.MODULO: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] % registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.NOT_EQUAL_STRICT: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] !== registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.NOT_EQUAL: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] != registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.EQUAL_STRICT: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] === registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.BIT_AND: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] & registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.BIT_SHIFT_LEFT: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] << registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.BIT_SHIFT_RIGHT: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] >> registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.MUL: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] * registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.LESS_OR_EQUAL: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] <= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.GREATER_OR_EQUAL: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] >= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.EQUAL: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] == registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.LESS: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] < registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.MORE: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]] > registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.MOV_REG_STACK: {
                            {
                                stack.push(registers[bytes[offset++]]);
                            }
                            break;
                        }
                        case OpCode.CALL: {
                            const totalArgs = readUnsignedLEB128();
                            const argStack = new Array(totalArgs);
                            for (let i = 0; i < totalArgs; i++)
                                argStack[totalArgs - i - 1] = stack.pop();
    
                            const $dst = bytes[offset++];
                            const $fn = bytes[offset++];
                            registers[$dst] = registers[$fn].apply(global_scope, argStack);
                            break;
                        }
                        case OpCode.NEW_CALL: {
                            const totalArgs = readUnsignedLEB128();
                            const argStack = new Array(totalArgs);
                            for (let i = 0; i < totalArgs; i++)
                                argStack[totalArgs - i - 1] = stack.pop();
                            const $fn = bytes[offset++];
                            const $dst = bytes[offset++];
                            registers[$dst] = Reflect.construct(registers[$fn], argStack);
                            break;
                        }
                        case OpCode.ASSIGN_PROP: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] = registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_PROP_PLUS: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] += registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_PROPERTY_ZERO_RIGHT_SHIFT_FILL: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] >>>= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_PROPERTY_PIPE: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] |= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_PROPERTY_MUL: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] *= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_PROPERTY_DIV: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] /= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_PROPERTY_XOR: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] ^= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_PROPERTY_BIT_AND: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] &= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_PROP_MINUS: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] -= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.LOAD_GLOBAL_SCOPE: {
                            {
                                registers[bytes[offset++]] = global_scope;
                            }
                            break;
                        }
                        case OpCode.LOAD_PROP: {
                            {
                                registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]];
                            }
                            break;
                        }
                        case OpCode.LOAD_BOOL: {
                            {
                                registers[bytes[offset++]] = !!(bytes[offset++]);
                            }
                            break;
                        }
                        case OpCode.PROP_CALL: {
                            const totalArgs = readUnsignedLEB128();
                            const argStack = new Array(totalArgs);
                            for (let i = 0; i < totalArgs; i++)
                                argStack[totalArgs - i - 1] = stack.pop();
                            const $dst = bytes[offset++];
                            const $obj = bytes[offset++];
                            const $prop = bytes[offset++];
                            const obj = registers[$obj];
                            const prop = registers[$prop];
                            registers[$dst] = obj[prop].apply(obj, argStack);
                            break;
                        }
                        case OpCode.THROW: {
                            {
                                throw registers[bytes[offset++]];
                            }
                        }
                        case OpCode.LOAD_GLOBAL: {
                            const $dst = bytes[offset++];
                            const throwsRefError = !!bytes[offset++];
                            const str_id = readUnsignedLEB128();
                            const prop = strings[str_id];
                            if (prop in imports) {
                                registers[$dst] = imports[prop];
                                break;
                            }
                            if (throwsRefError && !(prop in global_scope))
                                throw new ReferenceError(prop + " is not defined");
                            registers[$dst] = global_scope[prop];
                            break;
                        }
                        case OpCode.LOAD_ARRAY: {
                            {
                                const totalArgs = readUnsignedLEB128();
                                const arr = new Array(totalArgs);
                                for (let i = 0; i < totalArgs; i++)
                                    arr[totalArgs - i - 1] = stack.pop();
                                registers[bytes[offset++]] = arr;
                            }
                            break;
                        }
                        case OpCode.LOAD_OBJECT: {
                            const obj = {};
                            const totalProps = readUnsignedLEB128();
                            const $dst = bytes[offset++];
                            for (let i = 0; i < totalProps; i++) {
                                let val = stack.pop();
                                let key = stack.pop();
                                let type = stack.pop();
                                switch (type) {
                                    case 0: {
                                        obj[key] = val;
                                        break;
                                    }
                                    case 1: {
                                        Object.defineProperty(obj, key, {
                                            get: val,
                                        });
                                        break;
                                    }
                                    case 2: {
                                        Object.defineProperty(obj, key, {
                                            set: val,
                                        });
                                        break;
                                    }
                                }
                            }
                            registers[$dst] = obj;
                            break;
                        }
                        case OpCode.LOAD_NULL: {
                            {
                                registers[bytes[offset++]] = null;
                            }
                            break;
                        }
                        case OpCode.LOAD_UNDEFINED: {
                            {
                                registers[bytes[offset++]] = undefined;
                            }
                            break;
                        }
                        case OpCode.LOAD_VAR: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_VAR: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] = registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_VAR_PIPE: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] |= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_VAR_BITWISE_AND: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] &= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_VAR_BITSHIFT_LEFT: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] <<= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_VAR_MUL: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] *= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_VAR_DIV: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] /= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_VAR_XOR: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] ^= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_VAR_REMAINDER: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] %= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_VAR_ZERO_RIGHT_SHIFT_FILL: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] >>>= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_VAR_PLUS: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] += registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.ASSIGN_VAR_MINUS: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] -= registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.DECLARE: {
                            {
                                scope_data[readUnsignedLEB128()][readUnsignedLEB128()] = registers[bytes[offset++]];
                            }
                            break;
                        }
                        case OpCode.JMP_FALSE: {
                            const $src = bytes[offset++];
                            const dst = readU32();
                            if (!registers[$src])
                                offset = dst;
                            break;
                        }
                        case OpCode.JMP_TRUE: {
                            const $src = bytes[offset++];
                            const dst = readU32();
                            if (registers[$src])
                                offset = dst;
                            break;
                        }
                        case OpCode.JMP: {
                            const dst = readU32();
                            offset = dst;
                            break;
                        }
                        case OpCode.TERMINATE: {
                            return registers[return_register];
                        }
                        case OpCode.RETURN: {
                            let v = registers[return_register];
                            return v;
                        }
                        case OpCode.LOAD_SCOPE_DATA: {
                            {
                                registers[bytes[offset++]] = scope_data[readUnsignedLEB128()];
                            }
                            break;
                        }
                        case OpCode.TRY: {
                            {
                                tryCatches.push(readU32());
                            }
                            break;
                        }
                        case OpCode.LEAVE_TRY: {
                            tryCatches.pop();
                            break;
                        }
                        case OpCode.MOV_ERR_TO_VAR: {
                            {
                                scope_data[current_scope_id][readUnsignedLEB128()] = caughtError;
                            }
                            break;
                        }
                        default:
                            {
                                throw 'u' + op_code;
                            }
                    }
                }
            }
            function init_vm() {
                offset = 0;
                while (true) {
                    let op_code = bytes[offset++];
                    if (op_code === OpCode.REG_STR) {
                        strings.push(readString());
                    }
                    else if (op_code === OpCode.REG_SCOPE_PARENTS) {
                        const scope_id = readUnsignedLEB128();
                        const len = readUnsignedLEB128();
                        const parent_ids = [];
                        for (let i = 0; i < len; i++) {
                            parent_ids.push(readUnsignedLEB128());
                        }
                        parent_scope_ids[scope_id] = parent_ids;
                    }
                    else {
                        offset--;
                        return;
                    }
                }
            }
            init_vm();
            let fn = create_func(0, offset);
            fn.call(this);
            return exports;
        }
    
        const bytecode = "${bytecode}";
    
        _eval(bytecode, {});
    
    })();
    
      `;
        code = code.replace(/new Uint8Array/g, 'u8arr');
        code = code.replace(/new Uint16Array/g, 'u16arr');
        code = code.replace(/'use strict';/, `
    const u8arr = (...s) => new Uint8Array(...s);
    const u16arr = (...s) => new Uint16Array(...s);
  `);
        const matches = code.match(/case \w+\.\w+:/g);
        let inComment = false;
        /*
      
        */
        matches.forEach(match => {
            const aa = match.split(".")[1];
            const key = aa.slice(0, aa.length - 1);
            if (!usedOpCodes.has(key)) {
                code = code.replace(new RegExp(match.replace(/\./g, '\\.'), 'g'), match + 'break;');
            }
            else {
            }
        });
        if (inComment) {
            const reg = /default:\n\s+{\n\s+throw 'u'/;
            const match = code.match(reg);
            code = code.replace(reg, '*/' + match[0]);
        }
        let minifiedCode = yield (0, terser_1.minify)(code, {
            mangle: {
                properties: {
                    reserved: ['_$EXPORTS', 'require'],
                },
                toplevel: true,
            },
            compress: {
                hoist_vars: true,
                toplevel: true,
                passes: 20,
                unsafe: true,
                ecma: 2020,
                unsafe_arrows: true,
                arrows: true,
                unsafe_comps: true,
                unsafe_math: true,
                reduce_funcs: false,
            },
            format: {
                ecma: 2020,
            },
            ecma: 2020,
        });
        return minifiedCode.code.replace(/(case \d+:){3,}case \d+:break;/, '').replace(/const /g, 'let ');
    });
}
exports.getCompiler = getCompiler;
