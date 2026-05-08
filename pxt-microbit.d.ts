/**
 * ไฟล์ประกาศ Type สำหรับ MakeCode micro:bit API
 * (ใช้เพื่อไม่ให้ VS Code แสดง error ในโปรเจกต์ PXT Extension)
 * ไฟล์นี้ไม่ส่งผลต่อการทำงานจริงบน MakeCode
 */

// ===== Global Built-in Types ที่ TypeScript ต้องการ =====
interface Boolean { valueOf(): boolean; }
interface CallableFunction extends Function { }
interface Function { }
interface IArguments { }
interface NewableFunction extends Function { }
interface Number { toString(radix?: number): string; }
interface Object { }
interface RegExp { }
interface String {
    length: number;
    toString(): string;
    charAt(pos: number): string;
    charCodeAt(index: number): number;
}
interface Array<T> {
    length: number;
    push(item: T): void;
    pop(): T;
    forEach(callbackfn: (value: T, index: number) => void): void;
    removeAt(index: number): T;
    find(predicate: (value: T) => boolean): T;
    [index: number]: T;
}
interface TemplateStringsArray { }

// ===== ประเภทตัวเลขพิเศษของ MakeCode =====
type uint8 = number;
type uint16 = number;
type uint32 = number;
type int8 = number;
type int16 = number;
type int32 = number;

// ===== ฟังก์ชันทั่วไป (Global Functions) =====
declare function randint(min: number, max: number): number;

// ===== Buffer =====
interface Buffer {
    [index: number]: number;
    length: number;
}

// ===== control namespace =====
declare namespace control {
    function millis(): number;
    function runInParallel(handler: () => void): void;
    function waitMicros(micros: number): void;
}

// ===== basic namespace =====
declare namespace basic {
    function pause(ms: number): void;
    function showNumber(value: number): void;
    function showString(text: string): void;
    function showLeds(leds: string): void;
    function clearScreen(): void;
    function forever(handler: () => void): void;
}

// ===== input namespace =====
declare namespace input {
    function runningTime(): number;
    function onButtonPressed(button: Button, handler: () => void): void;
    function buttonIsPressed(button: Button): boolean;
}

declare const enum Button {
    A = 1,
    B = 2,
    AB = 3,
}

// ===== led namespace =====
declare namespace led {
    function plot(x: number, y: number): void;
    function unplot(x: number, y: number): void;
    function toggle(x: number, y: number): void;
    function point(x: number, y: number): boolean;
}

// ===== pins namespace =====
declare const enum DigitalPin {
    P0 = 100,
    P1 = 101,
    P2 = 102,
    P3 = 103,
    P4 = 104,
    P5 = 105,
    P6 = 106,
    P7 = 107,
    P8 = 108,
    P9 = 109,
    P10 = 110,
    P11 = 111,
    P12 = 112,
    P13 = 113,
    P14 = 114,
    P15 = 115,
    P16 = 116,
    P19 = 119,
    P20 = 120,
}

declare const enum AnalogPin {
    P0 = 100,
    P1 = 101,
    P2 = 102,
    P3 = 103,
    P4 = 104,
    P10 = 110,
}

declare const enum PinPullMode {
    PullUp = 0,
    PullDown = 1,
    PullNone = 2,
}

declare const enum PulseValue {
    High = 1,
    Low = 0,
}

declare namespace pins {
    function digitalReadPin(name: DigitalPin): number;
    function digitalWritePin(name: DigitalPin, value: number): void;
    function analogReadPin(name: AnalogPin): number;
    function analogWritePin(name: AnalogPin, value: number): void;
    function setPull(name: DigitalPin | AnalogPin, pull: PinPullMode): void;
    function onPulsed(name: DigitalPin, pulse: PulseValue, handler: () => void): void;
    function pulseDuration(): number;
    function pulseIn(name: DigitalPin, value: PulseValue, maxDuration?: number): number;
    function i2cWriteBuffer(address: number, buf: Buffer, repeat?: boolean): void;
    function i2cReadBuffer(address: number, size: number, repeat?: boolean): Buffer;
    function createBuffer(size: number): Buffer;
}

// ===== String =====
declare namespace String {
    function fromCharCode(code: number): string;
}

// ===== Math =====
declare namespace Math {
    function floor(x: number): number;
    function ceil(x: number): number;
    function round(x: number): number;
    function max(a: number, b: number): number;
    function min(a: number, b: number): number;
    function abs(x: number): number;
    function idiv(a: number, b: number): number;
    function constrain(value: number, low: number, high: number): number;
}
