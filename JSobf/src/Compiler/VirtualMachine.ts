import { OpCode } from "./Enums";
import inflate from "./TinyInflate_old";

const verbose = false;

// какой нахуй uint6 че за конченый еблан придумал юзать его
function b64ToUint6(nChr: number) {
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


function base64ToUint8(sBase64: string, nBlocksSize = 0) {
  var sB64Enc = sBase64.replace(/[^A-Za-z0-9+/]/g, ""),
    nInLen = sB64Enc.length,
    nOutLen = nBlocksSize
      ? Math.ceil(((nInLen * 3 + 1) >> 2) / nBlocksSize) * nBlocksSize
      : (nInLen * 3 + 1) >> 2,
    taBytes = new Uint8Array(nOutLen);

  const FIRST_BYTE_OFFSET = 0;
  for (
    var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = FIRST_BYTE_OFFSET;
    nInIdx < nInLen;
    nInIdx++
  ) {
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

export function _eval(instructions: string, imports = {}) {
  const global_scope = typeof globalThis != "undefined" ? globalThis : (typeof window != "undefined" ? window : imports);
  let scope = global_scope;
  const _require = typeof (require) != "undefined" ? require : function () { };
  const data = base64ToUint8(instructions);
  const compressed = !!data[0];
  const size = compressed ? ((data[1]) | (data[2] << 8) | (data[3] << 16) | (data[4] << 24)) : data.length;
  const bytes = compressed ? new Uint8Array(size) : new Uint8Array(data.buffer, 5, data.length - 5);
  if (compressed) inflate(new Uint8Array(data.buffer, 5, data.length - 5), bytes);
  let offset = 0;
  let scope_data: { [key: number]: { [key: number]: any } } = {};
  let registers: any[] = [];
  const strings: string[] = [];
  const stack: any[] = [];
  const exports = {};
  const parent_scope_ids: number[][] = [];
  let current_scope_id: number = 0;
  let current_fn_ref: any = null;
  let args: any[] = null;
  let tryCatches: number[] = [];
  let caughtError: any = null;

  const exportString = "_$EXPORTS".slice();
  const requireString = "require";

  (imports as any)[exportString] = exports;
  (imports as any)[requireString] = _require;

  const return_register = 0;

  const _F64 = new Float64Array(1);
  const _U8 = new Uint8Array(_F64.buffer);

  function readF64(): number {
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

  function readUnsignedLEB128(): number {
    let result = 0;
    let shift = 0;
    let byte = 0;
    while (true) {
      byte = bytes[offset++];
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) == 0) break;
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
    for (let i = 0; i < len; i++) str += String.fromCharCode(readUnsignedLEB128());
    return str;
  }

  function log(...args: any) {
    if (!verbose) return;
    console.log("VM", ...args);
  }

  function create_func(scope_id: number, exec_offset) {
    const parent_scope = scope_data;
    return function self_fn() {
      verbose && log(`=====================Called FN scope: ${scope_id}, exec_offset: ${exec_offset} =====================`);
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
      args = (arguments as any);
      scope = this;

      try {
        ret = run();
      } catch (e) {
        if (tryCatches.length) {
          const jmpTo = tryCatches.pop();
          offset = jmpTo;
          caughtError = e;
          ret = run();
        } else {
          if (verbose) {
            verbose && log("Error: " + e + " @ " + `scope: ${current_scope_id}`);
            verbose && log(scope_data);
          }

          err = e;
        }
      }

      // restore previous execution state
      tryCatches = old_try;
      offset = old_offset;
      registers = old_registers;
      current_fn_ref = old_self;
      scope_data = old_scope_data;
      current_scope_id = last_scope_id;
      args = old_args;
      scope = old_scope;

      // if an error occured during execution, throw it
      if (err) throw err;
      return ret;
    }
  }

  function run() {
    for (; ;) {
      const op_code = bytes[offset++];
      switch (op_code) {
        case OpCode.SELF_FN_REF: {
          const var_id = readUnsignedLEB128();
          const scope_id = readUnsignedLEB128();

          verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id}`);

          Object.defineProperty(scope_data[scope_id], var_id, {
            get() { return current_fn_ref },
            set() { },
          });
          break;
        }
        case OpCode.ARGUMENTS_REF: {
          if (verbose) {
            const varId = readUnsignedLEB128();
            verbose && log(OpCode[op_code] + ` varId: ${varId}`);
            scope_data[current_scope_id][varId] = args;
          } else {
            scope_data[current_scope_id][readUnsignedLEB128()] = args;
          }
          break;
        }
        case OpCode.INSTANCE_OF: {
          if (verbose) {
            const $dst = bytes[offset++];
            let a = registers[bytes[offset++]];
            let b = registers[bytes[offset++]];
            verbose && log(OpCode[op_code] + ` $a: ${a} $b: ${b} $dst: ${$dst}`);
            registers[$dst] = a instanceof b;
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] instanceof registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.IN: {
          if (verbose) {
            const $dst = bytes[offset++];
            let a = registers[bytes[offset++]];
            let b = registers[bytes[offset++]];
            verbose && log(OpCode[op_code] + ` $a: ${a} $b: ${b} $dst: ${$dst}`);
            registers[$dst] = a in b;
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] in registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.LOAD_INT: {
          if (verbose) {
            const $dst = bytes[offset++];
            const int = readUnsignedLEB128();
            verbose && log(OpCode[op_code] + ` $dst: ${$dst} val: ${int}`);
            registers[$dst] = int;
          } else {
            registers[bytes[offset++]] = readUnsignedLEB128();
          }
          break;
        }
        case OpCode.PLUS_PLUS: {
          if (verbose) {
            const $dst = bytes[offset++];
            const prefix = bytes[offset++];
            const scopeId = readUnsignedLEB128();
            const varId = readUnsignedLEB128();
            verbose && log(OpCode[op_code] + ` prefix: ${!!prefix} scopeId: ${scopeId} varId: ${varId} $dst: ${$dst}`);
            registers[$dst] = prefix ? ++scope_data[scopeId][varId] : scope_data[scopeId][varId]++;
          } else {
            registers[bytes[offset++]] = bytes[offset++] ? ++scope_data[readUnsignedLEB128()][readUnsignedLEB128()] : scope_data[readUnsignedLEB128()][readUnsignedLEB128()]++;
          }
          break;
        }
        case OpCode.MINUS_MINUS: {
          if (verbose) {
            const $dst = bytes[offset++];
            const prefix = bytes[offset++];
            const scopeId = readUnsignedLEB128();
            const varId = readUnsignedLEB128();
            verbose && log(OpCode[op_code] + ` prefix: ${!!prefix} scopeId: ${scopeId} varId: ${varId} $dst: ${$dst}`);
            registers[$dst] = prefix ? --scope_data[scopeId][varId] : scope_data[scopeId][varId]--;
          } else {
            registers[bytes[offset++]] = bytes[offset++] ? --scope_data[readUnsignedLEB128()][readUnsignedLEB128()] : scope_data[readUnsignedLEB128()][readUnsignedLEB128()]--;
          }
          break;
        }
        case OpCode.LOAD_F64: {
          if (verbose) {
            const $dst = bytes[offset++];
            const val = readF64();
            registers[$dst] = val;
            verbose && log(OpCode[op_code] + ` $dst: ${$dst} val: ${val}`);
          } else {
            registers[bytes[offset++]] = readF64();
          }
          break;
        }
        case OpCode.MOV_ARG_TO_VAR: {
          const arg_index = readUnsignedLEB128();
          const var_id = readUnsignedLEB128();
          verbose && log(OpCode[op_code] + ` argIndex: ${arg_index} varId: ${var_id}`);
          scope_data[current_scope_id][var_id] = args[arg_index];
          break;
        }
        case OpCode.MOVE_REG: {
          if (verbose) {
            const $to = bytes[offset++];
            const $from = bytes[offset++];
            registers[$to] = registers[$from];
            verbose && log(OpCode[op_code] + ` $to: ${$to} $from: ${$from}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.THIS: {
          if (verbose) {
            const $dst = bytes[offset++];
            registers[$dst] = scope;
            verbose && log(OpCode[op_code] + ` $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = scope;
          }
          break;
        }
        case OpCode.CREATE_FUNC: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const scope_offset = readU32();
            registers[$dst] = create_func(scope_id, scope_offset);
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} offset: ${scope_offset} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = create_func(readUnsignedLEB128(), readU32());
          }
          break;
        }
        case OpCode.OBJECT_PLUS_PLUS: {
          if (verbose) {
            const $dst = bytes[offset++];
            const prefix = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            const obj = registers[$obj];
            const prop = registers[$prop];
            registers[$dst] = prefix ? ++obj[prop] : obj[prop]++;
            verbose && log(OpCode[op_code] + ` prefix: ${!!prefix} $obj: ${$obj} $prop: ${$prop} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = bytes[offset++] ? ++registers[bytes[offset++]][registers[bytes[offset++]]] : registers[bytes[offset++]][registers[bytes[offset++]]]++;
          }
          break;
        }
        case OpCode.OBJECT_MINUS_MINUS: {
          if (verbose) {
            const $dst = bytes[offset++];
            const prefix = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            const obj = registers[$obj];
            const prop = registers[$prop];
            registers[$dst] = prefix ? --obj[prop] : obj[prop]--;
            verbose && log(OpCode[op_code] + ` prefix: ${!!prefix} $obj: ${$obj} $prop: ${$prop} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = bytes[offset++] ? --registers[bytes[offset++]][registers[bytes[offset++]]] : registers[bytes[offset++]][registers[bytes[offset++]]]--;
          }
          break;
        }
        case OpCode.LOAD_STR: {
          if (verbose) {
            const $dst = bytes[offset++];
            const str_id = readUnsignedLEB128();
            registers[$dst] = strings[str_id];
            verbose && log(OpCode[op_code] + ` stringId: ${str_id} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = strings[readUnsignedLEB128()];
          }
          break;
        }
        case OpCode.LOAD_REGEX: {
          if (verbose) {
            const $dst = bytes[offset++];
            const patternId = readUnsignedLEB128();
            const flagId = readUnsignedLEB128();
            registers[$dst] = new RegExp(strings[patternId], strings[flagId]);
            verbose && log(OpCode[op_code] + ` stringId: ${patternId} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = new RegExp(strings[readUnsignedLEB128()], strings[readUnsignedLEB128()]);
          }
          break;
        }
        case OpCode.UNARY_NOT: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $src = bytes[offset++];
            registers[$dst] = !registers[$src];
            verbose && log(OpCode[op_code] + ` $src: ${$src} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = !registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.UNARY_PLUS: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $src = bytes[offset++];
            registers[$dst] = +registers[$src];
            verbose && log(OpCode[op_code] + ` $src: ${$src} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = +registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.UNARY_VOID: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $src = bytes[offset++];
            registers[$dst] = void registers[$src];
            verbose && log(OpCode[op_code] + ` $src: ${$src} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = void registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.UNARY_INVERT: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $src = bytes[offset++];
            registers[$dst] = ~registers[$src];
            verbose && log(OpCode[op_code] + ` $src: ${$src} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = ~registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.UNARY_NEGATE: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $src = bytes[offset++];
            registers[$dst] = -registers[$src];
            verbose && log(OpCode[op_code] + ` $src: ${$src} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = -registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.UNARY_TYPEOF: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $src = bytes[offset++];
            registers[$dst] = typeof (registers[$src]);
            verbose && log(OpCode[op_code] + ` $src: ${$src} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = typeof (registers[bytes[offset++]]);
          }
          break;
        }
        case OpCode.UNARY_DELETE: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $src = bytes[offset++];
            registers[$dst] = delete (registers[$src]);
            verbose && log(OpCode[op_code] + ` op code: ${op_code} $src: ${$src} $dst: ${$dst}`);
            console.log("Object being deleted is: ", registers[$src]);
          } else {
            registers[bytes[offset++]] = delete (registers[bytes[offset++]]);
          }
          break;
        }
        case OpCode.UNARY_DELETE_MEMBER_EXPRESSION: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            registers[$dst] = delete (registers[$obj][registers[$prop]]);
            verbose && log(OpCode[op_code] + `$obj: ${$obj} $prop: ${$prop} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = delete (registers[bytes[offset++]][registers[bytes[offset++]]]);
          }
          break;
        }
        case OpCode.ADD: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] + registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] + registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.DIVIDE: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] / registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] / registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.SUB: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] - registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] - registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.BIT_XOR: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] ^ registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] ^ registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.PIPE: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] | registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] | registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.BIT_SHIFT_RIGHT_ZERO_FILL: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] >>> registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] >>> registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.MODULO: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] % registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] % registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.NOT_EQUAL_STRICT: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] !== registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] !== registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.NOT_EQUAL: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] != registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] != registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.EQUAL_STRICT: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] === registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] === registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.BIT_AND: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] & registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] & registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.BIT_SHIFT_LEFT: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] << registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] << registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.BIT_SHIFT_RIGHT: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] >> registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] >> registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.MUL: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] * registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] * registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.LESS_OR_EQUAL: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] <= registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] <= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.GREATER_OR_EQUAL: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] >= registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] >= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.EQUAL: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] == registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] == registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.LESS: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] < registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] < registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.MORE: {
          if (verbose) {
            const DST = bytes[offset++];
            const A = bytes[offset++];
            const B = bytes[offset++];
            registers[DST] = registers[A] > registers[B];
            verbose && log(OpCode[op_code] + ` $a: ${A} $b: ${B} $dst: ${DST}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]] > registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.MOV_REG_STACK: {
          if (verbose) {
            const $reg = bytes[offset++];
            stack.push(registers[$reg]);
            verbose && log(OpCode[op_code] + ` $src: ${$reg}`);
          } else {
            stack.push(registers[bytes[offset++]]);
          }
          break;
        }
        case OpCode.CALL: {
          const totalArgs = readUnsignedLEB128();
          const argStack = new Array(totalArgs);
          for (let i = 0; i < totalArgs; i++) argStack[totalArgs - i - 1] = stack.pop();
          const $dst = bytes[offset++];
          const $fn = bytes[offset++];
          verbose && log(OpCode[op_code] + ` $func: ${$fn} totalArgs: ${totalArgs}`);
          registers[$dst] = registers[$fn].apply(scope, argStack);
          break;
        }
        case OpCode.NEW_CALL: {
          const totalArgs = readUnsignedLEB128();
          const argStack = new Array(totalArgs);
          for (let i = 0; i < totalArgs; i++) argStack[totalArgs - i - 1] = stack.pop();

          const $fn = bytes[offset++];
          const $dst = bytes[offset++];
          verbose && log(OpCode[op_code] + ` $constructor: ${$fn} totalArgs: ${totalArgs}`);
          registers[$dst] = Reflect.construct(registers[$fn], argStack);
          break;
        }
        case OpCode.ASSIGN_PROP: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            const $val = bytes[offset++];
            verbose && log(OpCode[op_code] + ` $obj: ${$obj} $prop: ${$prop} $val: ${$val} $dst: ${$dst}`);
            registers[$dst] = registers[$obj][registers[$prop]] = registers[$val];
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] = registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_PROP_PLUS: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            const $val = bytes[offset++];
            verbose && log(OpCode[op_code] + ` $obj: ${$obj} $prop: ${$prop} $val: ${$val} $dst: ${$dst}`);
            registers[$dst] = registers[$obj][registers[$prop]] += registers[$val];
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] += registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_PROPERTY_ZERO_RIGHT_SHIFT_FILL: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            const $val = bytes[offset++];
            verbose && log(OpCode[op_code] + ` $obj: ${$obj} $prop: ${$prop} $val: ${$val} $dst: ${$dst}`);
            registers[$dst] = registers[$obj][registers[$prop]] >>>= registers[$val];
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] >>>= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_PROPERTY_PIPE: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            const $val = bytes[offset++];
            verbose && log(OpCode[op_code] + ` $obj: ${$obj} $prop: ${$prop} $val: ${$val} $dst: ${$dst}`);
            registers[$dst] = registers[$obj][registers[$prop]] |= registers[$val];
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] |= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_PROPERTY_MUL: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            const $val = bytes[offset++];
            verbose && log(OpCode[op_code] + ` $obj: ${$obj} $prop: ${$prop} $val: ${$val} $dst: ${$dst}`);
            registers[$dst] = registers[$obj][registers[$prop]] *= registers[$val];
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] *= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_PROPERTY_DIV: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            const $val = bytes[offset++];
            verbose && log(OpCode[op_code] + ` $obj: ${$obj} $prop: ${$prop} $val: ${$val} $dst: ${$dst}`);
            registers[$dst] = registers[$obj][registers[$prop]] /= registers[$val];
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] /= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_PROPERTY_XOR: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            const $val = bytes[offset++];
            verbose && log(OpCode[op_code] + ` $obj: ${$obj} $prop: ${$prop} $val: ${$val} $dst: ${$dst}`);
            registers[$dst] = registers[$obj][registers[$prop]] ^= registers[$val];
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] ^= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_PROPERTY_BIT_AND: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            const $val = bytes[offset++];
            verbose && log(OpCode[op_code] + ` $obj: ${$obj} $prop: ${$prop} $val: ${$val} $dst: ${$dst}`);
            registers[$dst] = registers[$obj][registers[$prop]] &= registers[$val];
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] &= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_PROP_MINUS: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            const $val = bytes[offset++];
            verbose && log(OpCode[op_code] + ` $obj: ${$obj} $prop: ${$prop} $val: ${$val} $dst: ${$dst}`);
            registers[$dst] = registers[$obj][registers[$prop]] -= registers[$val];
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]] -= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.LOAD_GLOBAL_SCOPE: {
          if (verbose) {
            const $dst = bytes[offset++];
            verbose && log(OpCode[op_code] + ` $dst: ${$dst}`);
            registers[$dst] = global_scope;
          } else {
            registers[bytes[offset++]] = global_scope;
          }
          break;
        }
        case OpCode.LOAD_PROP: {
          if (verbose) {
            const $dst = bytes[offset++];
            const $obj = bytes[offset++];
            const $prop = bytes[offset++];
            const obj = registers[$obj];
            const prop = registers[$prop];
            registers[$dst] = obj[prop];
            verbose && log(OpCode[op_code] + ` $obj: ${$obj} $prop: ${$prop} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = registers[bytes[offset++]][registers[bytes[offset++]]];
          }
          break;
        }
        case OpCode.LOAD_BOOL: {
          if (verbose) {
            const $dst = bytes[offset++];
            const val = !!bytes[offset++];
            verbose && log(OpCode[op_code] + ` $val: ${val} $dst: ${$dst}`);
            registers[$dst] = val;
          } else {
            registers[bytes[offset++]] = !!(bytes[offset++]);
          }
          break;
        }
        case OpCode.PROP_CALL: {
          const totalArgs = readUnsignedLEB128();
          const argStack = new Array(totalArgs);
          for (let i = 0; i < totalArgs; i++) argStack[totalArgs - i - 1] = stack.pop();
          const $dst = bytes[offset++];
          const $obj = bytes[offset++];
          const $prop = bytes[offset++];
          const obj = registers[$obj];
          const prop = registers[$prop];
          verbose && log(OpCode[op_code] + ` $obj: ${$obj} $prop: ${$prop} totalArgs: ${totalArgs}`);
          registers[$dst] = obj[prop].apply(obj, argStack);
          break;
        }
        case OpCode.THROW: {
          if (verbose) {
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` $src: ${$src}`);
            throw registers[$src];
          } else {
            throw registers[bytes[offset++]];
          }
        }
        case OpCode.LOAD_GLOBAL: {
          const $dst = bytes[offset++];
          const throwsRefError = !!bytes[offset++];

          const str_id = readUnsignedLEB128();

          const prop = strings[str_id];


          verbose && log(OpCode[op_code] + ` stringId: ${str_id} $dst: ${$dst}`);

          if (prop in imports) {
            registers[$dst] = imports[prop];
            break;
          }

          if (throwsRefError && !(prop in global_scope)) throw new ReferenceError(prop + " is not defined");

          registers[$dst] = global_scope[prop];
          break;
        }
        case OpCode.LOAD_ARRAY: {
          if (verbose) {
            const totalArgs = readUnsignedLEB128();
            const arr = new Array(totalArgs);
            const $dst = bytes[offset++];
            for (let i = 0; i < totalArgs; i++) arr[totalArgs - i - 1] = stack.pop();
            verbose && log(OpCode[op_code] + ` $dst: ${$dst} totalArgs: ${totalArgs}`);
            registers[$dst] = arr;
          } else {
            const totalArgs = readUnsignedLEB128();
            const arr = new Array(totalArgs);
            for (let i = 0; i < totalArgs; i++) arr[totalArgs - i - 1] = stack.pop();
            registers[bytes[offset++]] = arr;
          }
          break;
        }
        case OpCode.LOAD_OBJECT: {
          const obj = {};
          const totalProps = readUnsignedLEB128();
          const $dst = bytes[offset++];
          verbose && log(OpCode[op_code] + ` $dst: ${$dst} totalProps: ${totalProps}`);
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
          if (verbose) {
            const $dst = bytes[offset++];
            registers[$dst] = null;
            verbose && log(OpCode[op_code] + ` $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = null;
          }
          break;
        }
        case OpCode.LOAD_UNDEFINED: {
          if (verbose) {
            const $dst = bytes[offset++];
            registers[$dst] = undefined;
            verbose && log(OpCode[op_code] + ` $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = undefined;
          }
          break;
        }
        case OpCode.LOAD_VAR: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            registers[$dst] = scope_data[scope_id][var_id];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $dst: ${$dst}`);
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()];
          }
          break;
        }
        case OpCode.ASSIGN_VAR: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src} $dst: ${$dst}`);
            registers[$dst] = scope_data[scope_id][var_id] = registers[$src];
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] = registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_VAR_PIPE: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src} $dst: ${$dst}`);
            registers[$dst] = scope_data[scope_id][var_id] |= registers[$src];
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] |= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_VAR_BITWISE_AND: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src} $dst: ${$dst}`);
            registers[$dst] = scope_data[scope_id][var_id] &= registers[$src];
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] &= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_VAR_BITSHIFT_LEFT: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src} $dst: ${$dst}`);
            registers[$dst] = scope_data[scope_id][var_id] <<= registers[$src];
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] <<= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_VAR_MUL: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src} $dst: ${$dst}`);
            registers[$dst] = scope_data[scope_id][var_id] *= registers[$src];
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] *= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_VAR_DIV: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src} $dst: ${$dst}`);
            registers[$dst] = scope_data[scope_id][var_id] /= registers[$src];
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] /= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_VAR_XOR: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src} $dst: ${$dst}`);
            registers[$dst] = scope_data[scope_id][var_id] ^= registers[$src];
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] ^= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_VAR_REMAINDER: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src} $dst: ${$dst}`);
            registers[$dst] = scope_data[scope_id][var_id] %= registers[$src];
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] %= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_VAR_ZERO_RIGHT_SHIFT_FILL: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src} $dst: ${$dst}`);
            registers[$dst] = scope_data[scope_id][var_id] >>>= registers[$src];
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] >>>= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_VAR_PLUS: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src} $dst: ${$dst}`);
            registers[$dst] = scope_data[scope_id][var_id] += registers[$src];
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] += registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.ASSIGN_VAR_MINUS: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src} $dst: ${$dst}`);
            registers[$dst] = scope_data[scope_id][var_id] -= registers[$src];
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()][readUnsignedLEB128()] -= registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.DECLARE: {
          if (verbose) {
            const scope_id = readUnsignedLEB128();
            const var_id = readUnsignedLEB128();
            const $src = bytes[offset++];
            verbose && log(OpCode[op_code] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src}`);
            scope_data[scope_id][var_id] = registers[$src];
          } else {
            scope_data[readUnsignedLEB128()][readUnsignedLEB128()] = registers[bytes[offset++]];
          }
          break;
        }
        case OpCode.JMP_FALSE: {
          const $src = bytes[offset++];
          const dst = readU32();

          verbose && log(OpCode[op_code] + ` $test: ${$src} dst: ${dst}`);
          if (!registers[$src]) offset = dst;
          break;
        }
        case OpCode.JMP_TRUE: {
          const $src = bytes[offset++];
          const dst = readU32();

          verbose && log(OpCode[op_code] + ` $test: ${$src} dst: ${dst}`);
          if (registers[$src]) offset = dst;
          break;
        }
        case OpCode.JMP: {
          const dst = readU32();
          verbose && log(OpCode[op_code] + ` dst: ${dst}`);
          offset = dst;
          break;
        }
        case OpCode.TERMINATE: {
          verbose && log(OpCode[op_code]);
          return registers[return_register];
        }
        case OpCode.RETURN: {
          verbose && log(OpCode[op_code]);
          let v = registers[return_register];
          return v;
        }
        case OpCode.LOAD_SCOPE_DATA: {
          if (verbose) {
            const $dst = bytes[offset++];
            const scopeID = readUnsignedLEB128();
            verbose && log(OpCode[op_code] + ` scopeId: ${scopeID} $dst: ${$dst}`);
            registers[$dst] = scope_data[scopeID];
          } else {
            registers[bytes[offset++]] = scope_data[readUnsignedLEB128()];
          }
          break;
        }
        case OpCode.TRY: {
          if (verbose) {
            verbose && log(OpCode[op_code]);
            const jmp = readU32();
            tryCatches.push(jmp);
          } else {
            tryCatches.push(readU32());
          }
          break;
        }
        case OpCode.LEAVE_TRY: {
          verbose && log(OpCode[op_code]);
          tryCatches.pop();
          break;
        }
        case OpCode.MOV_ERR_TO_VAR: {
          if (verbose) {
            verbose && log(OpCode[op_code]);
            const varId = readUnsignedLEB128();
            scope_data[current_scope_id][varId] = caughtError;
          } else {
            scope_data[current_scope_id][readUnsignedLEB128()] = caughtError;
          }

          break;
        }
        default:
          {
            if (verbose) throw 'Unknown : ' + op_code + (" " + (OpCode as any)[op_code]) + " @ " + offset;
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
      } else if (op_code === OpCode.REG_SCOPE_PARENTS) {
        const scope_id = readUnsignedLEB128();
        const len = readUnsignedLEB128();
        const parent_ids: number[] = [];
        for (let i = 0; i < len; i++) {
          parent_ids.push(readUnsignedLEB128());
        }
        parent_scope_ids[scope_id] = parent_ids;

      } else {
        offset--;
        return;
      }
    }
  }

  init_vm();
  let fn = create_func(0, offset);
  fn.call(this)

  return exports;
}