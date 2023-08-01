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
const ASTInterfaces_1 = require("./ASTInterfaces");
const Enums_1 = require("./Enums");
const Parser_1 = require("./Parser");
const Utils_1 = require("./Utils");
const pako_1 = require("pako");
const CompilerVM_1 = require("./CompilerVM");
const PRE = "===================";
class Register {
    constructor($reg) {
        this.$reg = $reg;
    }
}
Register.ReturnRegister = new Register(0);
class JMPLabel {
    constructor(compiler) {
        this.start = -1;
        this.dest = -1;
        this.compiler = compiler;
        compiler.JMPLabels.push(this);
    }
    set_start() {
        this.start = this.compiler._buf.length;
        this.compiler.writeU32(0);
    }
    set_dst() {
        this.dest = this.compiler._buf.length;
    }
    link() {
        if (this.start < 0 || this.dest < 0)
            return;
        //throw `Did not properly link JMP_LABEL src: ${this.start} dst: ${this.dest}`;
        this.compiler.addLog("JMP_LABEL to: " + this.dest);
        this.compiler.writeU32At(this.dest, this.start);
        this.compiler.addLog(`Linking *${this.start} -> *${this.dest}`);
    }
}
class ScopeLink {
    constructor(compiler, target) {
        this.compiler = compiler;
        this.target = target;
        // get the current offset
        this.start = compiler._buf.length;
        compiler.writeU32(0);
        compiler.ScopeLinks.push(this);
    }
    link() {
        this.compiler.writeU32At(this.compiler.scopeOffsets.get(this.target.funcScopeId), this.start);
    }
}
const F64 = new Float64Array(1);
const U8 = new Uint8Array(F64.buffer);
class Compiler {
    randomiseOpCodes() {
        let isNumRegex = /^[0-9]+$/;
        let opCodeValues = [];
        let keyValues = [];
        for (let key in this.OpCode) {
            if (!isNumRegex.test(key)) {
                opCodeValues.push(this.OpCode[key]);
                keyValues.push(key);
            }
        }
        while (opCodeValues.length) {
            let idx = Math.floor(Math.random() * opCodeValues.length);
            let opCode = opCodeValues[idx];
            opCodeValues.splice(idx, 1);
            let key = keyValues.pop();
            // @ts-ignore
            this.OpCode[key] = opCode;
            // @ts-ignore
            this.OpCode[opCode] = key;
        }
    }
    addLog(str = "") {
        this.logs.push(str);
    }
    getLogs() {
        return this.logs.join("\n");
    }
    enterLoop() {
        this.breaks.push([]);
        this.continues.push(this._buf.length);
    }
    leaveLoop() {
        const breaks = this.breaks[this.breaks.length - 1];
        breaks.forEach(label => label.set_dst());
        this.breaks.pop();
        this.continues.pop();
    }
    addBreak() {
        const label = this.writeOpJMP();
        this.breaks[this.breaks.length - 1].push(label);
    }
    addContinue() {
        const label = this.writeOpJMP();
        const targetLabel = this.continues[this.continues.length - 1];
        label.dest = targetLabel;
    }
    setContinueTarget() {
        this.continues[this.continues.length - 1] = this._buf.length;
    }
    writeU8(u8) {
        (0, Utils_1.validateRange)(u8, 0, Math.pow(2, 8) - 1);
        (0, Utils_1.validateInt)(u8);
        this._buf.push(u8);
    }
    writeLeb128(num) {
        (0, Utils_1.validateRange)(num, 0, Math.pow(2, 32) - 1);
        (0, Utils_1.validateInt)(num);
        do {
            let byte = num & 0x7f;
            num >>>= 7;
            if (num !== 0) {
                byte |= 0x80;
            }
            this.writeU8(byte);
        } while (num !== 0);
    }
    writeU32(num) {
        (0, Utils_1.validateInt)(num);
        (0, Utils_1.validateRange)(num, 0, Math.pow(2, 32) - 1);
        this._buf.push(num & 0xff);
        this._buf.push((num >> 8) & 0xff);
        this._buf.push((num >> 16) & 0xff);
        this._buf.push((num >> 24) & 0xff);
    }
    writeU32At(num, offset) {
        (0, Utils_1.validateInt)(num);
        (0, Utils_1.validateRange)(num, 0, Math.pow(2, 32) - 1);
        this._buf[offset + 0] = num & 0xff;
        this._buf[offset + 1] = (num >> 8) & 0xff;
        this._buf[offset + 2] = (num >> 16) & 0xff;
        this._buf[offset + 3] = (num >> 24) & 0xff;
    }
    allocRegister() {
        const reg = this.registerPool.length ? this.registerPool.pop() : new Register(this.registerCursor++);
        return reg;
    }
    disposeRegister(reg) {
        if (reg.$reg == Register.ReturnRegister.$reg)
            return;
        this.registerPool.push(reg);
    }
    /*
    * Bytecode operations
    */
    writeOpDeclare(varId, scopeId, $reg) {
        this.addLog(this.OpCode[this.OpCode.DECLARE] + ` $scopeId: ${scopeId} varId: ${varId} $src: ${$reg.$reg}`);
        this.writeU8(this.OpCode.DECLARE);
        this.writeLeb128(scopeId);
        this.writeLeb128(varId);
        this.writeU8($reg.$reg);
    }
    writeOpLoadInt(int, $reg) {
        this.addLog(this.OpCode[this.OpCode.LOAD_INT] + ` $dst: ${$reg.$reg} val: ${int}`);
        (0, Utils_1.validateInt)(int);
        (0, Utils_1.validateRange)(int, 0, Math.pow(2, 32) - 1);
        this.writeU8(this.OpCode.LOAD_INT);
        this.writeU8($reg.$reg);
        this.writeLeb128(int);
    }
    writeOpLoadNum(num, $reg) {
        this.addLog(this.OpCode[this.OpCode.LOAD_F64] + ` $dst: ${$reg.$reg} val: ${num}`);
        this.writeU8(this.OpCode.LOAD_F64);
        this.writeU8($reg.$reg);
        F64[0] = num;
        this.writeU8(U8[0]);
        this.writeU8(U8[1]);
        this.writeU8(U8[2]);
        this.writeU8(U8[3]);
        this.writeU8(U8[4]);
        this.writeU8(U8[5]);
        this.writeU8(U8[6]);
        this.writeU8(U8[7]);
    }
    writeOpJMPFalse($reg, label = null) {
        this.addLog(this.OpCode[this.OpCode.JMP_FALSE] + ` $test: ${$reg.$reg}`);
        this.writeU8(this.OpCode.JMP_FALSE);
        this.writeU8($reg.$reg);
        if (!label) {
            label = new JMPLabel(this);
        }
        label.set_start();
        return label;
    }
    writeOpJMPTrue($reg, label = null) {
        this.addLog(this.OpCode[this.OpCode.JMP_TRUE] + ` $test: ${$reg.$reg}`);
        this.writeU8(this.OpCode.JMP_TRUE);
        this.writeU8($reg.$reg);
        if (!label) {
            label = new JMPLabel(this);
        }
        label.set_start();
        return label;
    }
    writeOpJMP(label = null) {
        this.addLog(this.OpCode[this.OpCode.JMP]);
        this.writeU8(this.OpCode.JMP);
        if (!label) {
            label = new JMPLabel(this);
        }
        label.set_start();
        return label;
    }
    writeOpPropCall($dst, $obj, $prop, totalArgs) {
        this.addLog(this.OpCode[this.OpCode.PROP_CALL] + ` $obj: ${$obj.$reg} $prop: ${$prop.$reg} totalArgs: ${totalArgs}`);
        this.writeU8(this.OpCode.PROP_CALL);
        this.writeLeb128(totalArgs);
        this.writeU8($dst.$reg);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
    }
    writeOpLoadProp($dst, $obj, $prop) {
        this.addLog(this.OpCode[this.OpCode.LOAD_PROP] + ` $obj: ${$obj.$reg} $prop: ${$prop.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LOAD_PROP);
        this.writeU8($dst.$reg);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
    }
    writeOpCallFunc($dst, $func, totalArgs) {
        this.addLog(this.OpCode[this.OpCode.CALL] + ` $func ${$func.$reg} totalArgs: ${totalArgs}`);
        this.writeU8(this.OpCode.CALL);
        this.writeLeb128(totalArgs);
        this.writeU8($dst.$reg);
        this.writeU8($func.$reg);
    }
    writeOpNewCall($constructor, $dst, totalArgs) {
        this.addLog(this.OpCode[this.OpCode.NEW_CALL] + ` $constructor: ${$constructor.$reg} totalArgs: ${totalArgs} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.NEW_CALL);
        this.writeLeb128(totalArgs);
        this.writeU8($constructor.$reg);
        this.writeU8($dst.$reg);
    }
    writeOpMovRegStack($src) {
        this.addLog(this.OpCode[this.OpCode.MOV_REG_STACK] + ` $src: ${$src.$reg}`);
        this.writeU8(this.OpCode.MOV_REG_STACK);
        this.writeU8($src.$reg);
    }
    writeOpMovReg(to, from) {
        this.addLog(this.OpCode[this.OpCode.MOVE_REG] + ` $to: ${to.$reg} $from: ${from.$reg}`);
        this.writeU8(this.OpCode.MOVE_REG);
        this.writeU8(to.$reg);
        this.writeU8(from.$reg);
    }
    writeOpLoadGlobal($dst, string_id, throwsReferenceError) {
        this.addLog(this.OpCode[this.OpCode.LOAD_GLOBAL] + ` stringId: ${string_id} prop: ${this.strings.get(string_id)} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LOAD_GLOBAL);
        this.writeU8($dst.$reg);
        this.writeU8(+throwsReferenceError);
        this.writeLeb128(string_id);
    }
    writeOpLoadVar(scope_id, var_id, $dst) {
        this.addLog(this.OpCode[this.OpCode.LOAD_VAR] + ` scopeId: ${scope_id} varId: ${var_id} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LOAD_VAR);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope_id);
        this.writeLeb128(var_id);
    }
    writeOpLoadString(str_id, $dst) {
        this.addLog(this.OpCode[this.OpCode.LOAD_STR] + ` stringId: ${str_id} str: ${this.strings.get(str_id)} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LOAD_STR);
        this.writeU8($dst.$reg);
        this.writeLeb128(str_id);
    }
    writeOpLoadRegex(patternId, flagsId, $dst) {
        this.addLog(this.OpCode[this.OpCode.LOAD_REGEX] + ` patternId: ${patternId} flagsId: ${flagsId} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LOAD_REGEX);
        this.writeU8($dst.$reg);
        this.writeLeb128(patternId);
        this.writeLeb128(flagsId);
    }
    writeOpRegStr(str) {
        this.addLog(this.OpCode[this.OpCode.REG_STR]);
        this.writeU8(this.OpCode.REG_STR);
        const str_len = str.length;
        this.writeLeb128(str_len);
        for (let i = 0; i < str_len; i++) {
            const char_code = str.charCodeAt(i);
            this.writeLeb128(char_code);
        }
    }
    writeOpRegScopeParents(scope_id, parent_ids) {
        this.addLog(this.OpCode[this.OpCode.REG_SCOPE_PARENTS]);
        this.writeU8(this.OpCode.REG_SCOPE_PARENTS);
        this.writeLeb128(scope_id);
        const len = parent_ids.length;
        this.writeLeb128(len);
        for (let i = 0; i < len; i++) {
            this.writeLeb128(parent_ids[i]);
        }
    }
    writeOpCreateFunc($dst, scope) {
        this.addLog(this.OpCode[this.OpCode.CREATE_FUNC] + ` scopeId: ${scope.funcScopeId} $offset: <computed_later> $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.CREATE_FUNC);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope.funcScopeId);
        new ScopeLink(this, scope);
    }
    writeOpReturn() {
        this.addLog(this.OpCode[this.OpCode.RETURN]);
        this.writeU8(this.OpCode.RETURN);
    }
    writeOpMovArgToVar(arg_index, var_id) {
        this.addLog(this.OpCode[this.OpCode.MOV_ARG_TO_VAR] + ` argIndex: ${arg_index} varId: ${var_id}`);
        this.writeU8(this.OpCode.MOV_ARG_TO_VAR);
        this.writeLeb128(arg_index);
        this.writeLeb128(var_id);
    }
    writeOpAdd($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.ADD] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ADD);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpSub($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.SUB] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.SUB);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpMul($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.MUL] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.MUL);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpLessEqual($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.LESS_OR_EQUAL] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LESS_OR_EQUAL);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpGreaterEqual($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.GREATER_OR_EQUAL] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.GREATER_OR_EQUAL);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpEqualStrict($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.EQUAL_STRICT] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.EQUAL_STRICT);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpEqual($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.EQUAL] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.EQUAL);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpNotEqual($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.NOT_EQUAL] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.NOT_EQUAL);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpDivide($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.DIVIDE] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.DIVIDE);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpLess($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.LESS] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LESS);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpMore($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.MORE] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.MORE);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpBitShiftLeft($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.BIT_SHIFT_LEFT] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.BIT_SHIFT_LEFT);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpBitShiftRightZeroFill($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.BIT_SHIFT_RIGHT_ZERO_FILL] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.BIT_SHIFT_RIGHT_ZERO_FILL);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpModulo($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.MODULO] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.MODULO);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpBitShiftRight($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.BIT_SHIFT_RIGHT] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.BIT_SHIFT_RIGHT);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpBitAnd($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.BIT_AND] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.BIT_AND);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpInstanceof($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.INSTANCE_OF] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.INSTANCE_OF);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpIn($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.IN] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.IN);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpBitXor($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.BIT_XOR] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.BIT_XOR);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpPipe($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.PIPE] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.PIPE);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpNotEqualStrict($reg_a, $reg_b, $dst) {
        this.addLog(this.OpCode[this.OpCode.NOT_EQUAL_STRICT] + ` $a: ${$reg_a.$reg} $b: ${$reg_b.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.NOT_EQUAL_STRICT);
        this.writeU8($dst.$reg);
        this.writeU8($reg_a.$reg);
        this.writeU8($reg_b.$reg);
    }
    writeOpAssignVar($dst, scope_id, var_id, $src) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_VAR);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope_id);
        this.writeLeb128(var_id);
        this.writeU8($src.$reg);
    }
    writeOpAssignVarPipe($dst, scope_id, var_id, $src) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR_PIPE] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_VAR_PIPE);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope_id);
        this.writeLeb128(var_id);
        this.writeU8($src.$reg);
    }
    writeOpAssignVarBitwiseAnd($dst, scope_id, var_id, $src) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR_BITWISE_AND] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_VAR_BITWISE_AND);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope_id);
        this.writeLeb128(var_id);
        this.writeU8($src.$reg);
    }
    writeOpAssignVarBitShiftLeft($dst, scope_id, var_id, $src) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR_BITSHIFT_LEFT] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_VAR_BITSHIFT_LEFT);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope_id);
        this.writeLeb128(var_id);
        this.writeU8($src.$reg);
    }
    writeOpAssignVarMul($dst, scope_id, var_id, $src) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR_MUL] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_VAR_MUL);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope_id);
        this.writeLeb128(var_id);
        this.writeU8($src.$reg);
    }
    writeOpAssignVarDiv($dst, scope_id, var_id, $src) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR_DIV] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_VAR_DIV);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope_id);
        this.writeLeb128(var_id);
        this.writeU8($src.$reg);
    }
    writeOpAssignPropertyMul($dst, $obj, $prop, $value) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_PROPERTY_MUL] + ` $obj: ${$obj.$reg} $prop: ${$prop.$reg} $value: ${$value.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_PROPERTY_MUL);
        this.writeU8($dst.$reg);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
        this.writeU8($value.$reg);
    }
    writeOpAssignPropertyDiv($dst, $obj, $prop, $value) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_PROPERTY_DIV] + ` $obj: ${$obj.$reg} $prop: ${$prop.$reg} $value: ${$value.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_PROPERTY_DIV);
        this.writeU8($dst.$reg);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
        this.writeU8($value.$reg);
    }
    writeOpAssignVarZeroRightShiftFill($dst, scope_id, var_id, $src) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR_ZERO_RIGHT_SHIFT_FILL] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_VAR_ZERO_RIGHT_SHIFT_FILL);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope_id);
        this.writeLeb128(var_id);
        this.writeU8($src.$reg);
    }
    //writeOpAssignVarPipe($src: Register, scope_id: number, var_id: number, $dst: Register) {
    //this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR_PIPE] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
    //this.writeU8(this.OpCode.ASSIGN_VAR_PIPE);
    //this.writeU8($dst.$reg);
    //this.writeU8($src.$reg);
    //this.writeLeb128(scope_id);
    //this.writeLeb128(var_id);
    //}
    //writeOpAssignVarZeroRightShiftFill($src: Register, scope_id: number, var_id: number, $dst: Register) {
    //this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR_ZERO_RIGHT_SHIFT_FILL] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
    //this.writeU8(this.OpCode.ASSIGN_VAR_ZERO_RIGHT_SHIFT_FILL);
    //this.writeU8($dst.$reg);
    //this.writeU8($src.$reg);
    //this.writeLeb128(scope_id);
    //this.writeLeb128(var_id);
    //}
    writeOpAssignVarPlus($src, scope_id, var_id, $dst) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR_PLUS] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_VAR_PLUS);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope_id);
        this.writeLeb128(var_id);
        this.writeU8($src.$reg);
    }
    writeOpAssignVarXor($src, scope_id, var_id, $dst) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR_XOR] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_VAR_XOR);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope_id);
        this.writeLeb128(var_id);
        this.writeU8($src.$reg);
    }
    writeOpAssignVarRemainder($src, scope_id, var_id, $dst) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR_REMAINDER] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_VAR_REMAINDER);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope_id);
        this.writeLeb128(var_id);
        this.writeU8($src.$reg);
    }
    writeOpAssignVarMinus($src, scope_id, var_id, $dst) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_VAR_MINUS] + ` scopeId: ${scope_id} varId: ${var_id} $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_VAR_MINUS);
        this.writeU8($dst.$reg);
        this.writeLeb128(scope_id);
        this.writeLeb128(var_id);
        this.writeU8($src.$reg);
    }
    writeOpPlusPlus(prefix, scopeId, varId, $dst) {
        this.addLog(this.OpCode[this.OpCode.PLUS_PLUS] + ` prefix: ${prefix} scopeId: ${scopeId} varId: ${varId} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.PLUS_PLUS);
        this.writeU8($dst.$reg);
        this.writeU8(+prefix);
        this.writeLeb128(scopeId);
        this.writeLeb128(varId);
    }
    writeOpMinusMinus(prefix, scopeId, varId, $dst) {
        this.addLog(this.OpCode[this.OpCode.MINUS_MINUS] + ` prefix: ${prefix} scopeId: ${scopeId} varId: ${varId} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.MINUS_MINUS);
        this.writeU8($dst.$reg);
        this.writeU8(+prefix);
        this.writeLeb128(scopeId);
        this.writeLeb128(varId);
    }
    writeOpSelfFnRef(var_id, scope_id) {
        this.addLog(this.OpCode[this.OpCode.SELF_FN_REF] + ` scopeId: ${scope_id} varId: ${var_id}`);
        this.writeU8(this.OpCode.SELF_FN_REF);
        this.writeLeb128(var_id);
        this.writeLeb128(scope_id);
    }
    writeOpThis($dst) {
        this.addLog(this.OpCode[this.OpCode.THIS] + ` $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.THIS);
        this.writeU8($dst.$reg);
    }
    writeOpAssignProperty($dst, $obj, $prop, $value) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_PROP] + ` $obj: ${$obj.$reg} $prop: ${$prop.$reg} $value: ${$value.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_PROP);
        this.writeU8($dst.$reg);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
        this.writeU8($value.$reg);
    }
    writeOpAssignPropertyPlus($dst, $obj, $prop, $value) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_PROP_PLUS] + ` $obj: ${$obj.$reg} $prop: ${$prop.$reg} $value: ${$value.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_PROP_PLUS);
        this.writeU8($dst.$reg);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
        this.writeU8($value.$reg);
    }
    writeOpAssignPropertyZeroRightFillShift($dst, $obj, $prop, $value) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_PROPERTY_ZERO_RIGHT_SHIFT_FILL] + ` $obj: ${$obj.$reg} $prop: ${$prop.$reg} $value: ${$value.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_PROPERTY_ZERO_RIGHT_SHIFT_FILL);
        this.writeU8($dst.$reg);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
        this.writeU8($value.$reg);
    }
    writeOpAssignPropertyPipe($dst, $obj, $prop, $value) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_PROPERTY_PIPE] + ` $obj: ${$obj.$reg} $prop: ${$prop.$reg} $value: ${$value.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_PROPERTY_PIPE);
        this.writeU8($dst.$reg);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
        this.writeU8($value.$reg);
    }
    writeOpAssignPropertyXor($dst, $obj, $prop, $value) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_PROPERTY_XOR] + ` $obj: ${$obj.$reg} $prop: ${$prop.$reg} $value: ${$value.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_PROPERTY_XOR);
        this.writeU8($dst.$reg);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
        this.writeU8($value.$reg);
    }
    writeOpAssignPropertyBitAnd($dst, $obj, $prop, $value) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_PROPERTY_BIT_AND] + ` $obj: ${$obj.$reg} $prop: ${$prop.$reg} $value: ${$value.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_PROPERTY_BIT_AND);
        this.writeU8($dst.$reg);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
        this.writeU8($value.$reg);
    }
    writeOpAssignPropertyMinus($dst, $obj, $prop, $value) {
        this.addLog(this.OpCode[this.OpCode.ASSIGN_PROP_MINUS] + ` $obj: ${$obj.$reg} $prop: ${$prop.$reg} $value: ${$value.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.ASSIGN_PROP_MINUS);
        this.writeU8($dst.$reg);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
        this.writeU8($value.$reg);
    }
    writeOpUnaryNot($dst, $src) {
        this.addLog(this.OpCode[this.OpCode.UNARY_NOT] + ` $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.UNARY_NOT);
        this.writeU8($dst.$reg);
        this.writeU8($src.$reg);
    }
    writeOpUnaryPlus($dst, $src) {
        this.addLog(this.OpCode[this.OpCode.UNARY_PLUS] + ` $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.UNARY_PLUS);
        this.writeU8($dst.$reg);
        this.writeU8($src.$reg);
    }
    writeOpUnaryVoid($dst, $src) {
        this.addLog(this.OpCode[this.OpCode.UNARY_VOID] + ` $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.UNARY_VOID);
        this.writeU8($dst.$reg);
        this.writeU8($src.$reg);
    }
    writeOpUnaryNegate($dst, $src) {
        this.addLog(this.OpCode[this.OpCode.UNARY_NEGATE] + ` $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.UNARY_NEGATE);
        this.writeU8($dst.$reg);
        this.writeU8($src.$reg);
    }
    writeOpUnaryInvert($dst, $src) {
        this.addLog(this.OpCode[this.OpCode.UNARY_INVERT] + ` $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.UNARY_INVERT);
        this.writeU8($dst.$reg);
        this.writeU8($src.$reg);
    }
    writeOpUnaryTypeof($dst, $src) {
        this.addLog(this.OpCode[this.OpCode.UNARY_TYPEOF] + ` $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.UNARY_TYPEOF);
        this.writeU8($dst.$reg);
        this.writeU8($src.$reg);
    }
    writeOpUnaryDelete($dst, $src) {
        this.addLog(this.OpCode[this.OpCode.UNARY_DELETE] + ` $src: ${$src.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.UNARY_DELETE);
        this.writeU8($dst.$reg);
        this.writeU8($src.$reg);
    }
    writeOpUnaryDeleteMemberExpression($dst, $obj, $prop) {
        this.addLog(this.OpCode[this.OpCode.UNARY_DELETE_MEMBER_EXPRESSION] + ` $obj: ${$obj.$reg} $prop: ${$prop.$reg}`);
        this.writeU8(this.OpCode.UNARY_DELETE_MEMBER_EXPRESSION);
        this.writeU8($dst.$reg);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
    }
    writeOpArgumentRef(varId) {
        this.addLog(this.OpCode[this.OpCode.ARGUMENTS_REF] + ` varId: ${varId}`);
        this.writeU8(this.OpCode.ARGUMENTS_REF);
        this.writeLeb128(varId);
    }
    writeOpLoadArray($dst, totalArgs) {
        this.addLog(this.OpCode[this.OpCode.LOAD_ARRAY] + ` totalArgs: ${totalArgs} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LOAD_ARRAY);
        this.writeLeb128(totalArgs);
        this.writeU8($dst.$reg);
    }
    writeOpLoadObject($dst, totalProps) {
        this.addLog(this.OpCode[this.OpCode.LOAD_OBJECT] + ` totalProps: ${totalProps} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LOAD_OBJECT);
        this.writeLeb128(totalProps);
        this.writeU8($dst.$reg);
    }
    writeOpLoadNull($dst) {
        this.addLog(this.OpCode[this.OpCode.LOAD_NULL] + ` $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LOAD_NULL);
        this.writeU8($dst.$reg);
    }
    writeOpLoadUndefined($dst) {
        this.addLog(this.OpCode[this.OpCode.LOAD_UNDEFINED] + ` $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LOAD_UNDEFINED);
        this.writeU8($dst.$reg);
    }
    writeOpLoadBool($dst, val) {
        this.addLog(this.OpCode[this.OpCode.LOAD_BOOL] + ` value: ${val} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LOAD_BOOL);
        this.writeU8($dst.$reg);
        this.writeU8(+val);
    }
    writeOpLoadScopeData($dst, scopeId) {
        this.addLog(this.OpCode[this.OpCode.LOAD_SCOPE_DATA] + ` scopeId: ${scopeId} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LOAD_SCOPE_DATA);
        this.writeU8($dst.$reg);
        this.writeLeb128(scopeId);
    }
    writeOpLoadGlobalScope($dst) {
        this.addLog(this.OpCode[this.OpCode.LOAD_GLOBAL_SCOPE] + ` $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.LOAD_GLOBAL_SCOPE);
        this.writeU8($dst.$reg);
    }
    writeOpThrow($src) {
        this.addLog(this.OpCode[this.OpCode.THROW] + ` $src: ${$src.$reg}`);
        this.writeU8(this.OpCode.THROW);
        this.writeU8($src.$reg);
    }
    writeOpObjectPlusPlus($dst, prefix, $obj, $prop) {
        this.addLog(this.OpCode[this.OpCode.OBJECT_PLUS_PLUS] + ` prefix: ${prefix} $obj: ${$obj.$reg} $prop: ${$prop.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.OBJECT_PLUS_PLUS);
        this.writeU8($dst.$reg);
        this.writeU8(+prefix);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
    }
    writeOpObjectMinusMinus($dst, prefix, $obj, $prop) {
        this.addLog(this.OpCode[this.OpCode.OBJECT_MINUS_MINUS] + ` prefix: ${prefix} $obj: ${$obj.$reg} $prop: ${$prop.$reg} $dst: ${$dst.$reg}`);
        this.writeU8(this.OpCode.OBJECT_MINUS_MINUS);
        this.writeU8($dst.$reg);
        this.writeU8(+prefix);
        this.writeU8($obj.$reg);
        this.writeU8($prop.$reg);
    }
    writeOpMovErrToVar(varId) {
        this.addLog(this.OpCode[this.OpCode.MOV_ERR_TO_VAR] + ` varId: ${varId}`);
        this.writeU8(this.OpCode.MOV_ERR_TO_VAR);
        this.writeLeb128(varId);
    }
    writeOpTry(label = null) {
        this.addLog(this.OpCode[this.OpCode.TRY]);
        this.writeU8(this.OpCode.TRY);
        if (!label)
            label = new JMPLabel(this);
        label.set_start();
        return label;
    }
    writeOpLeaveTry() {
        this.addLog(this.OpCode[this.OpCode.LEAVE_TRY]);
        this.writeU8(this.OpCode.LEAVE_TRY);
    }
    constructor(code, options) {
        this.logs = [];
        this.scopeOffsets = new Map();
        this.compressOutput = false;
        this.usedOpCodes = new Map();
        this.trapOpCodeAccess = false;
        this.strings = new Map();
        /*
        * A collection of jump labels that get linked at the end of the program
        */
        this.JMPLabels = [];
        this.ScopeLinks = [];
        /*
        * Dealing with break statements
        */
        this.breaks = [];
        this.continues = [];
        /*
        * A buffer for writing information into
        */
        this._buf = [];
        /*
        * A pool for creating and disposing registers
        */
        this.registerCursor = 1;
        this.registerPool = [];
        this.codeLength = 0;
        const usedOpCodes = this.usedOpCodes;
        const getTrack = () => {
            return this.trapOpCodeAccess;
        };
        const obj = {};
        for (let key in Enums_1.OpCode) {
            if (isNaN(Number(key))) {
                obj[key] = Enums_1.OpCode[key];
            }
        }
        // @ts-ignore
        this.OpCode = new Proxy(obj, {
            get(target, prop, receiver) {
                if (getTrack())
                    usedOpCodes.set(prop, true);
                return target[prop];
            }
        });
        const parser = new Parser_1.Parser();
        this.codeLength = code.length;
        parser.parse(code);
        this.parser = parser;
        this.compressOutput = !!options.compress;
    }
    compile() {
        return __awaiter(this, void 0, void 0, function* () {
            this.randomiseOpCodes();
            this.addLog();
            this.addLog(`${PRE} this.OpCodeS ${PRE}`);
            this.trapOpCodeAccess = false;
            for (let key in this.OpCode) {
                if (Number.isInteger(Number(key))) {
                    this.addLog(`${this.OpCode[key]}: ${key}`);
                }
            }
            this.addLog(`${PRE}  ${PRE}`);
            this.addLog();
            this.trapOpCodeAccess = true;
            // pack strings into the vm
            this.addLog();
            this.addLog(`${PRE} STRING IDS ${PRE}`);
            this.parser.strings.forEach((id, str) => {
                this.writeOpRegStr(str);
                this.strings.set(id, str);
                this.addLog(`str: ${str} id: ${id}`);
            });
            this.addLog(`${PRE}  ${PRE}`);
            this.addLog();
            const funcScopes = this.parser.functionScopes;
            for (let i = 0; i < funcScopes.length; i++) {
                const scope = funcScopes[i];
                let parent_scopes = [];
                let parent = scope.parent;
                while (parent) {
                    parent_scopes.push(parent.funcScopeId);
                    parent = parent.parent;
                }
                this.writeOpRegScopeParents(scope.funcScopeId, parent_scopes);
            }
            this.scopeOffsets.set(funcScopes[0].funcScopeId, this._buf.length);
            for (let i = 0; i < funcScopes.length; i++) {
                let scope = funcScopes[i];
                this.compileScope(scope);
                if ((i + 1) < funcScopes.length) {
                    const next_scope = funcScopes[i + 1];
                    this.scopeOffsets.set(next_scope.funcScopeId, this._buf.length);
                }
            }
            this.addLog();
            this.addLog(`${PRE} SCOPE OFFSETS ${PRE}`);
            this.scopeOffsets.forEach((offset, scopeId) => {
                this.addLog(`scope: ${scopeId} -> ${offset}`);
            });
            this.addLog(`${PRE}  ${PRE}`);
            this.addLog();
            // link any labels
            this.JMPLabels.forEach(label => label.link());
            this.ScopeLinks.forEach(link => link.link());
            const bytes = new Uint8Array(this._buf);
            const deflateSize = bytes.length;
            const b64 = Buffer.from(bytes).toString("base64");
            const header = [
                this.compressOutput ? 1 : 0,
                (deflateSize & 0xff),
                ((deflateSize >> 8) & 0xff),
                ((deflateSize >> 16) & 0xff),
                ((deflateSize >> 24) & 0xff),
            ];
            this.trapOpCodeAccess = false;
            if (this.compressOutput) {
                const compressed = Buffer.from(new Uint8Array([...header, ...(0, pako_1.deflateRaw)(bytes)])).toString("base64");
                console.log('pako compression output is ' + (100 * compressed.length / (b64.length + header.length)) + "% the size of original!");
                console.log("output is " + (100 * compressed.length / (this.codeLength)) + " of the input code size");
                const outputCode = yield (0, CompilerVM_1.getCompiler)(this.OpCode, compressed, this.usedOpCodes);
                return [outputCode, this.getLogs(), this.OpCode];
            }
            const outputBytecode = Buffer.from(new Uint8Array([...header, ...bytes])).toString('base64');
            const outputCode = yield (0, CompilerVM_1.getCompiler)(this.OpCode, outputBytecode, this.usedOpCodes);
            return [outputCode, this.getLogs(), this.OpCode];
        });
    }
    compileScope(scope) {
        this.addLog();
        this.addLog(`${PRE} INSTRUCTIONS FOR SCOPE: ${scope.funcScopeId} ${PRE}`);
        this.walkNode(scope.JSVM_ROOT);
        this.writeU8(this.OpCode.TERMINATE);
        this.addLog(`${PRE} ${PRE}`);
        this.addLog();
    }
    walkNode(node) {
        switch (node.type) {
            case ASTInterfaces_1.JSVM_Collection.type: {
                const scope = node;
                scope.nodes.forEach(child => {
                    let $reg = this.walkNode(child);
                    if ($reg)
                        this.disposeRegister($reg);
                });
                return null;
            }
            case ASTInterfaces_1.JSVM_PlusPlus.type: {
                const p = node;
                const $reg = this.allocRegister();
                this.writeOpPlusPlus(p.prefix, p.funcScopeId, p.varId, $reg);
                return $reg;
            }
            case ASTInterfaces_1.JSVM_MinusMinus.type: {
                const p = node;
                const $reg = this.allocRegister();
                this.writeOpMinusMinus(p.prefix, p.funcScopeId, p.varId, $reg);
                return $reg;
            }
            case ASTInterfaces_1.JSVM_Declare.type: {
                const declare = node;
                const $reg = this.walkNode(declare.init);
                this.writeOpDeclare(declare.varId, declare.funcScopeId, $reg);
                this.disposeRegister($reg);
                return null;
            }
            case ASTInterfaces_1.JSVM_LoadInt.type: {
                const loadint = node;
                const $reg = this.allocRegister();
                if (loadint.value < 0 || loadint.value > Math.pow(2, 32) - 1 || !(0, Utils_1.isInt)(loadint.value))
                    this.writeOpLoadNum(loadint.value, $reg);
                else {
                    this.writeOpLoadInt(loadint.value, $reg);
                }
                return $reg;
            }
            case ASTInterfaces_1.JSVM_Return.type: {
                const ret = node;
                if (ret.arg) {
                    const $dst = this.walkNode(ret.arg);
                    this.writeOpMovReg(Register.ReturnRegister, $dst);
                    this.disposeRegister($dst);
                }
                this.writeOpReturn();
                return null;
            }
            case ASTInterfaces_1.JSVM_SelfFnRef.type: {
                const ref = node;
                this.writeOpSelfFnRef(ref.varId, ref.scopeId);
                return null;
            }
            case ASTInterfaces_1.JSVM_This.type: {
                const $reg = this.allocRegister();
                this.writeOpThis($reg);
                return $reg;
            }
            case ASTInterfaces_1.JSVM_NewCall.type: {
                const func = node;
                let totalArgs = 0;
                const $func = this.walkNode(func.callee);
                const args = func.arguments;
                args.forEach((arg) => {
                    const $ret = this.walkNode(arg);
                    if ($ret) {
                        totalArgs++;
                        this.writeOpMovRegStack($ret);
                        this.disposeRegister($ret);
                    }
                });
                const $dst = $func;
                this.writeOpNewCall($func, $dst, totalArgs);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_Break.type: {
                this.addBreak();
                return null;
            }
            case ASTInterfaces_1.JSVM_ContinueStatement.type: {
                this.addContinue();
                return null;
            }
            case ASTInterfaces_1.JSVM_ConditionalIfStatement.type: {
                const cond = node;
                let $test = this.walkNode(cond.test);
                const testLabel = this.writeOpJMPFalse($test);
                this.disposeRegister($test);
                let $dst = this.walkNode(cond.consequent);
                const jmpLabel = this.writeOpJMP();
                testLabel.set_dst();
                let $alt = this.walkNode(cond.alternate);
                this.writeOpMovReg($dst, $alt);
                this.disposeRegister($alt);
                jmpLabel.set_dst();
                return $dst;
            }
            case ASTInterfaces_1.JSVM_ObjectPlusPlus.type: {
                const object = node;
                const $obj = this.walkNode(object.object);
                const $prop = this.walkNode(object.property);
                const $dst = $prop;
                this.writeOpObjectPlusPlus($dst, object.prefix, $obj, $prop);
                this.disposeRegister($obj);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_ObjectMinusMinus.type: {
                const object = node;
                const $obj = this.walkNode(object.object);
                const $prop = this.walkNode(object.property);
                const $dst = $prop;
                this.writeOpObjectMinusMinus($dst, object.prefix, $obj, $prop);
                this.disposeRegister($obj);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_Throw.type: {
                const throwNode = node;
                this.writeOpThrow(this.walkNode(throwNode.argument));
                return null;
            }
            case ASTInterfaces_1.JSVM_AssignProperty.type: {
                const assign = node;
                const $obj = this.walkNode(assign.obj);
                const $prop = this.walkNode(assign.prop);
                const $value = this.walkNode(assign.value);
                const $dst = $value;
                this.writeOpAssignProperty($dst, $obj, $prop, $value);
                this.disposeRegister($obj);
                this.disposeRegister($prop);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignPropertyPlus.type: {
                const assign = node;
                const $obj = this.walkNode(assign.obj);
                const $prop = this.walkNode(assign.prop);
                const $value = this.walkNode(assign.value);
                const $dst = $value;
                this.writeOpAssignPropertyPlus($dst, $obj, $prop, $value);
                this.disposeRegister($obj);
                this.disposeRegister($prop);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignPropertyZeroRightShiftFill.type: {
                const assign = node;
                const $obj = this.walkNode(assign.obj);
                const $prop = this.walkNode(assign.prop);
                const $value = this.walkNode(assign.value);
                const $dst = $value;
                this.writeOpAssignPropertyZeroRightFillShift($dst, $obj, $prop, $value);
                this.disposeRegister($obj);
                this.disposeRegister($prop);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignPropertyPipe.type: {
                const assign = node;
                const $obj = this.walkNode(assign.obj);
                const $prop = this.walkNode(assign.prop);
                const $value = this.walkNode(assign.value);
                const $dst = $value;
                this.writeOpAssignPropertyPipe($dst, $obj, $prop, $value);
                this.disposeRegister($obj);
                this.disposeRegister($prop);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignPropertyMul.type: {
                const assign = node;
                const $obj = this.walkNode(assign.obj);
                const $prop = this.walkNode(assign.prop);
                const $value = this.walkNode(assign.value);
                const $dst = $value;
                this.writeOpAssignPropertyMul($dst, $obj, $prop, $value);
                this.disposeRegister($obj);
                this.disposeRegister($prop);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignPropertyDiv.type: {
                const assign = node;
                const $obj = this.walkNode(assign.obj);
                const $prop = this.walkNode(assign.prop);
                const $value = this.walkNode(assign.value);
                const $dst = $value;
                this.writeOpAssignPropertyDiv($dst, $obj, $prop, $value);
                this.disposeRegister($obj);
                this.disposeRegister($prop);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignPropertyXor.type: {
                const assign = node;
                const $obj = this.walkNode(assign.obj);
                const $prop = this.walkNode(assign.prop);
                const $value = this.walkNode(assign.value);
                const $dst = $value;
                this.writeOpAssignPropertyXor($dst, $obj, $prop, $value);
                this.disposeRegister($obj);
                this.disposeRegister($prop);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignPropertyBitwiseAnd.type: {
                const assign = node;
                const $obj = this.walkNode(assign.obj);
                const $prop = this.walkNode(assign.prop);
                const $value = this.walkNode(assign.value);
                const $dst = $value;
                this.writeOpAssignPropertyBitAnd($dst, $obj, $prop, $value);
                this.disposeRegister($obj);
                this.disposeRegister($prop);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignPropertyMinus.type: {
                const assign = node;
                const $obj = this.walkNode(assign.obj);
                const $prop = this.walkNode(assign.prop);
                const $value = this.walkNode(assign.value);
                const $dst = $value;
                this.writeOpAssignPropertyMinus($dst, $obj, $prop, $value);
                this.disposeRegister($obj);
                this.disposeRegister($prop);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_ArgumentsRef.type: {
                const argReg = node;
                this.writeOpArgumentRef(argReg.varId);
                return null;
            }
            case ASTInterfaces_1.JSVM_SwitchStatement.type: {
                const switchStatement = node;
                let $descrim = this.walkNode(switchStatement.discriminant);
                let default_node = null;
                let default_jump = null;
                let tests_nodes = [];
                switchStatement.cases.forEach(child => {
                    if (child.test === null) {
                        if (default_node)
                            throw ("Already has default node");
                        //is default case
                        default_node = child;
                        tests_nodes.push(null);
                    }
                    else {
                        let $reg = this.walkNode(child.test);
                        let $dst = this.allocRegister();
                        this.writeOpEqualStrict($descrim, $reg, $dst);
                        let jump_label = this.writeOpJMPTrue($dst);
                        this.disposeRegister($reg);
                        this.disposeRegister($dst);
                        tests_nodes.push(jump_label);
                    }
                });
                this.disposeRegister($descrim);
                if (default_node) {
                    let jump_label = this.writeOpJMP();
                    default_jump = jump_label;
                }
                let skip = this.writeOpJMP();
                this.enterLoop();
                for (let i = 0; i < switchStatement.cases.length; i++) {
                    const child = switchStatement.cases[i];
                    let jump_label = null;
                    if (child.test === null) {
                        if (!default_node)
                            throw ("No has default node");
                        jump_label = default_jump;
                    }
                    else {
                        jump_label = tests_nodes[i];
                    }
                    jump_label.set_dst();
                    child.consequent.forEach(switch_case => {
                        let $reg = this.walkNode(switch_case);
                        if ($reg)
                            this.disposeRegister($reg);
                    });
                }
                skip.set_dst();
                this.leaveLoop();
                return null;
            }
            case ASTInterfaces_1.JSVM_FuncCall.type: {
                const func = node;
                const $func = this.walkNode(func.callee);
                const args = func.arguments;
                let totalArgs = 0;
                args.forEach((arg) => {
                    const $ret = this.walkNode(arg);
                    if ($ret) {
                        totalArgs++;
                        this.writeOpMovRegStack($ret);
                        this.disposeRegister($ret);
                    }
                });
                let $dst = $func;
                this.writeOpCallFunc($dst, $func, totalArgs);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_MoveArgToVar.type: {
                const mov = node;
                this.writeOpMovArgToVar(mov.arg_index, mov.var_id);
                return null;
            }
            case ASTInterfaces_1.JSVM_AssignVariable.type: {
                const assignment = node;
                const identifier = assignment.variable;
                const $value = this.walkNode(assignment.value);
                const $dst = $value;
                this.writeOpAssignVar($dst, identifier.scope_id, identifier.var_id, $value);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignVariablePipe.type: {
                const assignment = node;
                const identifier = assignment.variable;
                const $value = this.walkNode(assignment.value);
                const $dst = $value;
                this.writeOpAssignVarPipe($value, identifier.scope_id, identifier.var_id, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignVariableBitwiseAnd.type: {
                const assignment = node;
                const identifier = assignment.variable;
                const $value = this.walkNode(assignment.value);
                const $dst = $value;
                this.writeOpAssignVarBitwiseAnd($value, identifier.scope_id, identifier.var_id, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignVariableBitShiftLeft.type: {
                const assignment = node;
                const identifier = assignment.variable;
                const $value = this.walkNode(assignment.value);
                const $dst = $value;
                this.writeOpAssignVarBitShiftLeft($value, identifier.scope_id, identifier.var_id, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignVariableMul.type: {
                const assignment = node;
                const identifier = assignment.variable;
                const $value = this.walkNode(assignment.value);
                const $dst = $value;
                this.writeOpAssignVarMul($value, identifier.scope_id, identifier.var_id, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignVariableDiv.type: {
                const assignment = node;
                const identifier = assignment.variable;
                const $value = this.walkNode(assignment.value);
                const $dst = $value;
                this.writeOpAssignVarDiv($value, identifier.scope_id, identifier.var_id, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignVariableZeroRightShiftFill.type: {
                const assignment = node;
                const identifier = assignment.variable;
                const $value = this.walkNode(assignment.value);
                const $dst = $value;
                this.writeOpAssignVarZeroRightShiftFill($value, identifier.scope_id, identifier.var_id, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignVariablePlus.type: {
                const assignment = node;
                const identifier = assignment.variable;
                const $value = this.walkNode(assignment.value);
                const $dst = $value;
                this.writeOpAssignVarPlus($value, identifier.scope_id, identifier.var_id, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignVariableXor.type: {
                const assignment = node;
                const identifier = assignment.variable;
                const $value = this.walkNode(assignment.value);
                const $dst = $value;
                this.writeOpAssignVarXor($value, identifier.scope_id, identifier.var_id, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignVariableRemainder.type: {
                const assignment = node;
                const identifier = assignment.variable;
                const $value = this.walkNode(assignment.value);
                const $dst = $value;
                this.writeOpAssignVarRemainder($value, identifier.scope_id, identifier.var_id, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_AssignVariableMinus.type: {
                const assignment = node;
                const identifier = assignment.variable;
                const $value = this.walkNode(assignment.value);
                const $dst = $value;
                this.writeOpAssignVarMinus($value, identifier.scope_id, identifier.var_id, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_UnaryNot.type: {
                const not = node;
                const $ret = this.walkNode(not.argument);
                const $dst = $ret;
                this.writeOpUnaryNot($ret, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_UnaryPlus.type: {
                const not = node;
                const $ret = this.walkNode(not.argument);
                const $dst = $ret;
                this.writeOpUnaryPlus($ret, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_UnaryVoid.type: {
                const not = node;
                const $ret = this.walkNode(not.argument);
                const $dst = $ret;
                this.writeOpUnaryVoid($ret, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_UnaryNegate.type: {
                const not = node;
                const $ret = this.walkNode(not.argument);
                const $dst = $ret;
                this.writeOpUnaryNegate($ret, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_UnaryInvert.type: {
                const not = node;
                const $ret = this.walkNode(not.argument);
                const $dst = $ret;
                this.writeOpUnaryInvert($ret, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_UnaryTypeof.type: {
                const not = node;
                const $ret = this.walkNode(not.argument);
                const $dst = $ret;
                this.writeOpUnaryTypeof($ret, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_UnaryDelete.type: {
                const not = node;
                const $ret = this.walkNode(not.argument);
                const $dst = $ret;
                this.writeOpUnaryDelete($ret, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_UnaryDeleteMemberExpression.type: {
                const not = node;
                const arg = not.argument;
                const $obj = this.walkNode(arg.object);
                const $prop = this.walkNode(arg.property);
                const $dst = $prop;
                this.writeOpUnaryDeleteMemberExpression($dst, $obj, $prop);
                this.disposeRegister($obj);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_MemberExpression.type: {
                const exp = node;
                const $obj = this.walkNode(exp.object);
                const $prop = this.walkNode(exp.property);
                const $dst = $prop;
                this.writeOpLoadProp($dst, $obj, $prop);
                this.disposeRegister($obj);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_WhileLoop.type: {
                const whileNode = node;
                this.enterLoop();
                this.setContinueTarget();
                const gotoTestLabel = new JMPLabel(this);
                gotoTestLabel.set_dst();
                const $ret = this.walkNode(whileNode.test);
                const gotoEndLabel = this.writeOpJMPFalse($ret);
                this.disposeRegister($ret);
                const $bodyRet = this.walkNode(whileNode.body);
                if ($bodyRet)
                    this.disposeRegister($bodyRet);
                this.writeOpJMP(gotoTestLabel);
                gotoEndLabel.set_dst();
                this.leaveLoop();
                return null;
            }
            case ASTInterfaces_1.JSVM_DoWhileLoop.type: {
                const doWhileNode = node;
                this.enterLoop();
                const gotoStartLabel = new JMPLabel(this);
                gotoStartLabel.set_dst();
                const $bodyRet = this.walkNode(doWhileNode.body);
                if ($bodyRet)
                    this.disposeRegister($bodyRet);
                const $ret = this.walkNode(doWhileNode.test);
                this.writeOpJMPTrue($ret, gotoStartLabel);
                this.disposeRegister($ret);
                this.leaveLoop();
                return null;
            }
            case ASTInterfaces_1.JSVM_ForLoop.type: {
                const ifNode = node;
                this.enterLoop();
                if (ifNode.init) {
                    let initReg = this.walkNode(ifNode.init);
                    if (initReg)
                        this.disposeRegister(initReg);
                }
                const gotoTestLabel = new JMPLabel(this);
                gotoTestLabel.set_dst();
                this.setContinueTarget();
                let gotoEndLabel = null;
                if (ifNode.test) {
                    let src = this.walkNode(ifNode.test);
                    gotoEndLabel = this.writeOpJMPFalse(src);
                    this.disposeRegister(src);
                }
                if (ifNode.body) {
                    let $reg = this.walkNode(ifNode.body);
                    if ($reg)
                        this.disposeRegister($reg);
                }
                if (ifNode.update) {
                    let $reg = this.walkNode(ifNode.update);
                    if ($reg)
                        this.disposeRegister($reg);
                }
                this.writeOpJMP(gotoTestLabel);
                if (gotoEndLabel)
                    gotoEndLabel.set_dst();
                this.leaveLoop();
                return null;
            }
            case ASTInterfaces_1.JSVM_Array.type: {
                const array = node;
                let totalArgs = 0;
                array.elements.forEach((arg) => {
                    const $ret = this.walkNode(arg);
                    this.writeOpMovRegStack($ret);
                    this.disposeRegister($ret);
                    totalArgs++;
                });
                const $dst = this.allocRegister();
                this.writeOpLoadArray($dst, totalArgs);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_BinaryExpression.type: {
                const expression = node;
                const $left = this.walkNode(expression.left);
                const $right = this.walkNode(expression.right);
                const $dst = $left;
                const operator = expression.operator;
                switch (operator) {
                    case '+': {
                        this.writeOpAdd($left, $right, $dst);
                        break;
                    }
                    case '-': {
                        this.writeOpSub($left, $right, $dst);
                        break;
                    }
                    case '*': {
                        this.writeOpMul($left, $right, $dst);
                        break;
                    }
                    case "<=": {
                        this.writeOpLessEqual($left, $right, $dst);
                        break;
                    }
                    case ">=": {
                        this.writeOpGreaterEqual($left, $right, $dst);
                        break;
                    }
                    case '===': {
                        this.writeOpEqualStrict($left, $right, $dst);
                        break;
                    }
                    case '==': {
                        this.writeOpEqual($left, $right, $dst);
                        break;
                    }
                    case '!=': {
                        this.writeOpNotEqual($left, $right, $dst);
                        break;
                    }
                    case '/': {
                        this.writeOpDivide($left, $right, $dst);
                        break;
                    }
                    case "<": {
                        this.writeOpLess($left, $right, $dst);
                        break;
                    }
                    case ">": {
                        this.writeOpMore($left, $right, $dst);
                        break;
                    }
                    case "<<": {
                        this.writeOpBitShiftLeft($left, $right, $dst);
                        break;
                    }
                    case '^': {
                        this.writeOpBitXor($left, $right, $dst);
                        break;
                    }
                    case '|': {
                        this.writeOpPipe($left, $right, $dst);
                        break;
                    }
                    case '!==': {
                        this.writeOpNotEqualStrict($left, $right, $dst);
                        break;
                    }
                    case '>>>': {
                        this.writeOpBitShiftRightZeroFill($left, $right, $dst);
                        break;
                    }
                    case '%': {
                        this.writeOpModulo($left, $right, $dst);
                        break;
                    }
                    case '>>': {
                        this.writeOpBitShiftRight($left, $right, $dst);
                        break;
                    }
                    case '&': {
                        this.writeOpBitAnd($left, $right, $dst);
                        break;
                    }
                    case 'instanceof': {
                        this.writeOpInstanceof($left, $right, $dst);
                        break;
                    }
                    case 'in': {
                        this.writeOpIn($left, $right, $dst);
                        break;
                    }
                    default:
                        throw 'Compiler::walkNode Unknown BinaryExpression operator: ' + operator;
                }
                // free the right register (now unused) 
                this.disposeRegister($right);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_Sequence.type: {
                const seq = node;
                let lastReg = null;
                seq.sequence.forEach(s => {
                    let nextReg = this.walkNode(s);
                    if (lastReg)
                        this.disposeRegister(lastReg);
                    lastReg = nextReg;
                });
                if (!lastReg)
                    throw "Compiler::walkNode Sequence must return a register at the end!";
                return lastReg;
            }
            case ASTInterfaces_1.JSVM_LogicalAnd.type: {
                const logicalAnd = node;
                let $src1 = this.walkNode(logicalAnd.left);
                let $dst = this.allocRegister();
                this.writeOpMovReg($dst, $src1);
                this.disposeRegister($src1);
                //if its false, we want to exit the entire check
                let jmp_if_true = this.writeOpJMPFalse($dst);
                let $src2 = this.walkNode(logicalAnd.right);
                this.writeOpMovReg($dst, $src2);
                jmp_if_true.set_dst();
                this.disposeRegister($src2);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_LogicalOr.type: {
                const logicalOr = node;
                let $src1 = this.walkNode(logicalOr.left);
                let $dst = this.allocRegister();
                this.writeOpMovReg($dst, $src1);
                this.disposeRegister($src1);
                let jmp_if_false = this.writeOpJMPTrue($dst);
                let $src2 = this.walkNode(logicalOr.right);
                this.writeOpMovReg($dst, $src2);
                this.disposeRegister($src2);
                jmp_if_false.set_dst();
                return $dst;
            }
            case ASTInterfaces_1.JSVM_PropertyFuncCall.type: {
                const func = node;
                const $obj = this.walkNode(func.callee.object);
                const $prop = this.walkNode(func.callee.property);
                const args = func.arguments; // get the arguments
                let totalArgs = 0;
                args.forEach((arg) => {
                    const $arg = this.walkNode(arg);
                    if ($arg) {
                        this.writeOpMovRegStack($arg);
                        this.disposeRegister($arg);
                        totalArgs++;
                    }
                });
                const $dst = $obj;
                this.writeOpPropCall($dst, $obj, $prop, totalArgs);
                // free the function register!
                this.disposeRegister($prop);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_Identifier.type: {
                const identifier = node;
                const $dst = this.allocRegister();
                if (identifier.global)
                    this.writeOpLoadGlobal($dst, identifier.string_id, identifier.throwReferenceError);
                else
                    this.writeOpLoadVar(identifier.scope_id, identifier.var_id, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_Regex.type: {
                const regex = node;
                const $dst = this.allocRegister();
                this.writeOpLoadRegex(regex.patternId, regex.flagsId, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_StringLiteral.type: {
                const literal = node;
                const $dst = this.allocRegister();
                this.writeOpLoadString(literal.string_id, $dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_Global.type: {
                const $dst = this.allocRegister();
                this.writeOpLoadGlobalScope($dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_CreateFunc.type: {
                const func = node;
                const $dst = this.allocRegister();
                let scope = null;
                for (let i = 0; i < this.parser.functionScopes.length; i++) {
                    if (this.parser.functionScopes[i].funcScopeId === func.scope_id) {
                        scope = this.parser.functionScopes[i];
                        break;
                    }
                }
                if (!scope)
                    throw "missing the scope";
                this.writeOpCreateFunc($dst, scope);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_LoadNull.type: {
                const $dst = this.allocRegister();
                this.writeOpLoadNull($dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_Boolean.type: {
                const bool = node;
                const $dst = this.allocRegister();
                this.writeOpLoadBool($dst, bool.val);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_LoadUndefined.type: {
                const $dst = this.allocRegister();
                this.writeOpLoadUndefined($dst);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_Object.type: {
                const object = node;
                let total = 0;
                // reverse it for the VM, TODO: FIXME: CHANGEME:
                object.properties.reverse().forEach(prop => {
                    const $reg = this.allocRegister();
                    total++;
                    switch (prop.kind) {
                        case 'set': {
                            this.writeOpLoadNum(2, $reg);
                            this.writeOpMovRegStack($reg);
                            break;
                        }
                        case 'get': {
                            this.writeOpLoadNum(1, $reg);
                            this.writeOpMovRegStack($reg);
                            break;
                        }
                        case 'init': {
                            this.writeOpLoadNum(0, $reg);
                            this.writeOpMovRegStack($reg);
                            break;
                        }
                        default:
                            throw "Compiler::walkNode unknown property kind: " + prop.kind;
                    }
                    // write the property name to the stack
                    this.writeOpLoadString(prop.keyStringId, $reg);
                    this.writeOpMovRegStack($reg);
                    const $val = this.walkNode(prop.value);
                    // write the property value to the stack
                    this.writeOpMovRegStack($val);
                    this.disposeRegister($reg);
                    this.disposeRegister($val);
                });
                const $dst = this.allocRegister();
                this.writeOpLoadObject($dst, total);
                return $dst;
            }
            case ASTInterfaces_1.JSVM_Catch.type: {
                const catchNode = node;
                this.writeOpMovErrToVar(catchNode.param.var_id);
                this.walkNode(catchNode.body);
                return null;
            }
            case ASTInterfaces_1.JSVM_TryStatement.type: {
                const tryStatement = node;
                const labelGotoCatch = this.writeOpTry();
                const $body = this.walkNode(tryStatement.body);
                if ($body)
                    this.disposeRegister($body);
                this.writeOpLeaveTry();
                let labelSkipCatch = this.writeOpJMP();
                labelGotoCatch.set_dst();
                if (tryStatement.catch) {
                    let $catch = this.walkNode(tryStatement.catch);
                    if ($catch)
                        this.disposeRegister($catch);
                }
                labelSkipCatch.set_dst();
                if (tryStatement.finially) {
                    let $finially = this.walkNode(tryStatement.finially);
                    if ($finially)
                        this.disposeRegister($finially);
                }
                return null;
            }
            case ASTInterfaces_1.JSVM_IfStatement.type: {
                const ifstatement = node;
                const $test = this.walkNode(ifstatement.test);
                const jmp1 = this.writeOpJMPFalse($test);
                this.disposeRegister($test);
                let $reg = this.walkNode(ifstatement.consequent);
                if ($reg)
                    this.disposeRegister($reg);
                const jmp2 = this.writeOpJMP();
                jmp1.set_dst();
                if (ifstatement.alternate) {
                    let $reg = this.walkNode(ifstatement.alternate);
                    if ($reg)
                        this.disposeRegister($reg);
                }
                jmp2.set_dst();
                return null;
            }
            default: {
                // throw Error("Compiler::walkNode unknown node type: " + node.type);
                console.log("Compiler::walkNode unknown node type: " + node.type);
            }
        }
    }
}
exports.default = Compiler;
