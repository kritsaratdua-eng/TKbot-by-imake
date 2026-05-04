/*
Shenzhen ACEBOTT Tech
modified from liusen
developed by imake
load dependency
"TinkerBott": "file:../pxt-TinkerBott"
*/

const enum IR_Button {
    //% block="any"
    Any = -1,
    //% block="▲"
    Up = 0x62,
    //% block=" "
    Unused_2 = -2,
    //% block="◀"
    Left = 0x22,
    //% block="OK"
    Ok = 0x02,
    //% block="▶"
    Right = 0xc2,
    //% block=" "
    Unused_3 = -3,
    //% block="▼"
    Down = 0xa8,
    //% block=" "
    Unused_4 = -4,
    //% block="1"
    Number_1 = 0x68,
    //% block="2"
    Number_2 = 0x98,
    //% block="3"
    Number_3 = 0xb0,
    //% block="4"
    Number_4 = 0x30,
    //% block="5"
    Number_5 = 0x18,
    //% block="6"
    Number_6 = 0x7a,
    //% block="7"
    Number_7 = 0x10,
    //% block="8"
    Number_8 = 0x38,
    //% block="9"
    Number_9 = 0x5a,
    //% block="*"
    Star = 0x42,
    //% block="0"
    Number_0 = 0x4a,
    //% block="#"
    Hash = 0x52,
}

const enum IR_ButtonAction {
    //% block="Pressed"
    Pressed = 0,
    //% block="Released"
    Released = 1,
}

const enum IrProtocol {
    //% block="Keyestudio"
    Keyestudio = 0,
    //% block="NEC"
    NEC = 1,
}


enum DigitalWritePin {
    //% block="P0"
    P0 = 0,
    //% block="P1"
    P1 = 1,
    //% block="P2"
    P2 = 2,
    //% block="P5"
    P5 = 5,
    //% block="P8"
    P8 = 8,
    //% block="P9"
    P9 = 9,
    //% block="P11"
    P11 = 11,
    //% block="P12"
    P12 = 12,
    //% block="P13(SCK)"
    P13 = 13,
    //% block="P14(MISO)"
    P14 = 14,
    //% block="P15(MOSI)"
    P15 = 15,
    //% block="P16"
    P16 = 16
}

enum DistanceUnit {
    //% block="cm"
    CM = 0,
    //% block="inch"
    INCH = 1
}

namespace background {

    export enum Thread {
        Priority = 0,
        UserCallback = 1,
    }

    export enum Mode {
        Repeat,
        Once,
    }

    class Executor {
        _newJobs: Job[] = [];
        _jobsToRemove: number[] = [];
        _pause: number = 100;
        _type: Thread;

        constructor(type: Thread) {
            this._type = type;
            this._newJobs = [];
            this._jobsToRemove = [];
            control.runInParallel(() => this.loop());
        }

        push(task: () => void, delay: number, mode: Mode): number {
            if (delay > 0 && delay < this._pause && mode === Mode.Repeat) {
                this._pause = Math.floor(delay);
            }
            const job = new Job(task, delay, mode);
            this._newJobs.push(job);
            return job.id;
        }

        cancel(jobId: number) {
            this._jobsToRemove.push(jobId);
        }

        loop(): void {
            const _jobs: Job[] = [];

            let previous = control.millis();

            while (true) {
                const now = control.millis();
                const delta = now - previous;
                previous = now;

                // เพิ่มงานใหม่
                this._newJobs.forEach(function (job: Job, index: number) {
                    _jobs.push(job);
                });
                this._newJobs = [];

                // ยกเลิกงาน
                this._jobsToRemove.forEach(function (jobId: number, index: number) {
                    for (let i = _jobs.length - 1; i >= 0; i--) {
                        const job = _jobs[i];
                        if (job.id == jobId) {
                            _jobs.removeAt(i);
                            break;
                        }
                    }
                });
                this._jobsToRemove = []


                // ประมวลผลงานทั้งหมด
                if (this._type === Thread.Priority) {
                    // งานใหม่ล่าสุดก่อน
                    for (let i = _jobs.length - 1; i >= 0; i--) {
                        if (_jobs[i].run(delta)) {
                            this._jobsToRemove.push(_jobs[i].id)
                        }
                    }
                } else {
                    // ประมวลผลตามลำดับเวลา
                    for (let i = 0; i < _jobs.length; i++) {
                        if (_jobs[i].run(delta)) {
                            this._jobsToRemove.push(_jobs[i].id)
                        }
                    }
                }

                basic.pause(this._pause);
            }
        }
    }

    class Job {
        id: number;
        func: () => void;
        delay: number;
        remaining: number;
        mode: Mode;

        constructor(func: () => void, delay: number, mode: Mode) {
            this.id = randint(0, 2147483647)
            this.func = func;
            this.delay = delay;
            this.remaining = delay;
            this.mode = mode;
        }

        run(delta: number): boolean {
            if (delta <= 0) {
                return false;
            }

            this.remaining -= delta;
            if (this.remaining > 0) {
                return false;
            }

            switch (this.mode) {
                case Mode.Once:
                    this.func();
                    basic.pause(0);
                    return true;
                case Mode.Repeat:
                    this.func();
                    this.remaining = this.delay;
                    basic.pause(0);
                    return false;
            }
        }
    }

    const queues: Executor[] = [];

    export function schedule(
        func: () => void,
        type: Thread,
        mode: Mode,
        delay: number,
    ): number {
        if (!func || delay < 0) return 0;

        if (!queues[type]) {
            queues[type] = new Executor(type);
        }

        return queues[type].push(func, delay, mode);
    }

    export function remove(type: Thread, jobId: number): void {
        if (queues[type]) {
            queues[type].cancel(jobId);
        }
    }
}


//% color="#6e5ba4" weight=20 icon="icon.png"
namespace TinkerBott {

    // เริ่มต้นตัวรับสัญญาณ IR
    let irState: IrState;

    const IR_REPEAT = 256;
    const IR_INCOMPLETE = 257;
    const IR_DATAGRAM = 258;

    const REPEAT_TIMEOUT_MS = 120;

    interface IrState {
        protocol: IrProtocol | undefined;
        hasNewDatagram: boolean;
        bitsReceived: uint8;
        addressSectionBits: uint16;
        commandSectionBits: uint16;
        hiword: uint16;
        loword: uint16;
        activeCommand: number;
        repeatTimeout: number;
        onIrButtonPressed: IrButtonHandler[];
        onIrButtonReleased: IrButtonHandler[];
        onIrDatagram: (() => void) | undefined;
    }
    class IrButtonHandler {
        irButton: IR_Button;
        onEvent: () => void;

        constructor(
            irButton: IR_Button,
            onEvent: () => void
        ) {
            this.irButton = irButton;
            this.onEvent = onEvent;
        }
    }


    function appendBitToDatagram(bit: number): number {
        irState.bitsReceived += 1;

        if (irState.bitsReceived <= 8) {
            irState.hiword = (irState.hiword << 1) + bit;
            if (irState.protocol === IrProtocol.Keyestudio && bit === 1) {
                // กู้คืนบิตข้อมูลที่หายไปในช่วงเริ่มต้น
                // ที่อยู่ Keyestudio คือ 0 ดังนั้นสามารถตรวจจับบิตที่หายไปได้
                // โดยการตรวจสอบบิตที่อยู่ส่วนกลับบิตแรก (ซึ่งคือ 1)
                irState.bitsReceived = 9;
                irState.hiword = 1;
            }
        } else if (irState.bitsReceived <= 16) {
            irState.hiword = (irState.hiword << 1) + bit;
        } else if (irState.bitsReceived <= 32) {
            irState.loword = (irState.loword << 1) + bit;
        }

        if (irState.bitsReceived === 32) {
            irState.addressSectionBits = irState.hiword & 0xffff;
            irState.commandSectionBits = irState.loword & 0xffff;
            return IR_DATAGRAM;
        } else {
            return IR_INCOMPLETE;
        }
    }

    function decode(markAndSpace: number): number {
        if (markAndSpace < 1600) {
            // บิตต่ำ (Low)
            return appendBitToDatagram(0);
        } else if (markAndSpace < 2700) {
            // บิตสูง (High)
            return appendBitToDatagram(1);
        }

        irState.bitsReceived = 0;

        if (markAndSpace < 12500) {
            // ตรวจพบการทำซ้ำ
            return IR_REPEAT;
        } else if (markAndSpace < 14500) {
            // ตรวจพบการเริ่มต้น
            return IR_INCOMPLETE;
        } else {
            return IR_INCOMPLETE;
        }
    }

    function enableIrMarkSpaceDetection(pin: DigitalPin) {
        pins.setPull(pin, PinPullMode.PullNone);

        let mark = 0;
        let space = 0;

        pins.onPulsed(pin, PulseValue.Low, () => {
            // สัญญาณระดับสูง (HIGH)
            mark = pins.pulseDuration();
        });

        pins.onPulsed(pin, PulseValue.High, () => {
            // สัญญาณระดับต่ำ (LOW)
            space = pins.pulseDuration();
            const status = decode(mark + space);

            if (status !== IR_INCOMPLETE) {
                handleIrEvent(status);
            }
        });
    }

    function handleIrEvent(irEvent: number) {

        // รีเฟรชตัวจับเวลาการทำซ้ำ
        if (irEvent === IR_DATAGRAM || irEvent === IR_REPEAT) {
            irState.repeatTimeout = input.runningTime() + REPEAT_TIMEOUT_MS;
        }

        if (irEvent === IR_DATAGRAM) {
            irState.hasNewDatagram = true;

            if (irState.onIrDatagram) {
                background.schedule(irState.onIrDatagram, background.Thread.UserCallback, background.Mode.Once, 0);
            }

            const newCommand = irState.commandSectionBits >> 8;

            // ประมวลผลคำสั่งใหม่
            if (newCommand !== irState.activeCommand) {

                if (irState.activeCommand >= 0) {
                    const releasedHandler = irState.onIrButtonReleased.find(h => h.irButton === irState.activeCommand || IR_Button.Any === h.irButton);
                    if (releasedHandler) {
                        background.schedule(releasedHandler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                    }
                }

                const pressedHandler = irState.onIrButtonPressed.find(h => h.irButton === newCommand || IR_Button.Any === h.irButton);
                if (pressedHandler) {
                    background.schedule(pressedHandler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                }

                irState.activeCommand = newCommand;
            }
        }
    }

    function initIrState() {
        if (irState) {
            return;
        }

        irState = {
            protocol: undefined,
            bitsReceived: 0,
            hasNewDatagram: false,
            addressSectionBits: 0,
            commandSectionBits: 0,
            hiword: 0, // TODO เปลี่ยนเป็น uint32
            loword: 0,
            activeCommand: -1,
            repeatTimeout: 0,
            onIrButtonPressed: [],
            onIrButtonReleased: [],
            onIrDatagram: undefined,
        };
    }

    function notifyIrEvents() {
        if (irState.activeCommand === -1) {
            // ข้ามเพื่อประหยัดการทำงานของ CPU
        } else {
            const now = input.runningTime();
            if (now > irState.repeatTimeout) {
                // หมดเวลาการทำซ้ำ

                const handler = irState.onIrButtonReleased.find(h => h.irButton === irState.activeCommand || IR_Button.Any === h.irButton);
                if (handler) {
                    background.schedule(handler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                }

                irState.bitsReceived = 0;
                irState.activeCommand = -1;
            }
        }
    }

    //% blockId=IR_onButton
    //% block="on IR button | %button | %action"
    //% button.fieldEditor="gridpicker"
    //% button.fieldOptions.columns=3
    //% button.fieldOptions.tooltips="false"
    //% group="IR Receiver"
    export function IR_onButton(
        button: IR_Button,
        action: IR_ButtonAction,
        handler: () => void
    ) {
        initIrState();
        if (action === IR_ButtonAction.Pressed) {
            irState.onIrButtonPressed.push(new IrButtonHandler(button, handler));
        }
        else {
            irState.onIrButtonReleased.push(new IrButtonHandler(button, handler));
        }
    }


    //% blockId=IR_DecodeResult
    //% block="IR button code %button"
    //% button.fieldEditor="gridpicker"
    //% button.fieldOptions.columns=3
    //% button.fieldOptions.tooltips="false"
    //% group="IR Receiver"
    export function IR_isDecodeResult(button: IR_Button): boolean {
        let d = -1
        basic.pause(0); // ยอมให้พื้นหลังทำงานเมื่อเรียกในลูปที่ทำงานต่อเนื่อง
        if (!irState) {
            d = IR_Button.Any
        } else {
            d = irState.commandSectionBits >> 8
        }
        return (d == button)
    }

    //% blockId=IR_isReceived
    //% block="on IR received"
    //% group="IR Receiver"
    export function IR_isReceived(): boolean {
        basic.pause(0); // ยอมให้พื้นหลังทำงานเมื่อเรียกในลูปที่ทำงานต่อเนื่อง
        initIrState();
        if (irState.hasNewDatagram) {
            irState.hasNewDatagram = false;
            return true;
        } else {
            return false;
        }
    }

    // /**
    //  * Returns the command code of a specific IR button.
    //  * @param button the button
    //  */
    // //% blockId=IR_ButtonCode
    // //% button.fieldEditor="gridpicker"
    // //% button.fieldOptions.columns=3
    // //% button.fieldOptions.tooltips="false"
    // //% block="IR button code %button"
    // //% group="IR Receiver"
    // export function IR_ButtonCode(button: IR_Button): number {
    //   basic.pause(0); // ยอมให้พื้นหลังทำงานเมื่อเรียกในลูปที่ทำงานต่อเนื่อง
    //   return button as number;
    // }

    function ir_rec_to16BitHex(value: number): string {
        let hex = "";
        for (let pos = 0; pos < 4; pos++) {
            let remainder = value % 16;
            if (remainder < 10) {
                hex = remainder.toString() + hex;
            } else {
                hex = String.fromCharCode(55 + remainder) + hex;
            }
            value = Math.idiv(value, 16);
        }
        return hex;
    }

    //% blockId="IRReceiver_init"
    //% block="connect IR receiver to %pin"
    //% pin.fieldEditor="gridpicker"
    //% pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false"
    //% group="IR Receiver"
    export function IRReceiver_init(pin: DigitalPin): void {
        initIrState();

        if (irState.protocol) {
            return;
        }

        irState.protocol = 1;

        enableIrMarkSpaceDetection(pin);

        background.schedule(notifyIrEvents, background.Thread.Priority, background.Mode.Repeat, REPEAT_TIMEOUT_MS);
    }
    // สิ้นสุดส่วนตัวรับสัญญาณ IR


    //% blockId=ledMatrixShowHex block="LED Matrix show hex %hex_num"
    //% group="LED Matrix"
    export function ledMatrixShowHex(hex_num: number): void {
        for (let i = 0; i < 25; i += 5) {
            for (let j = 0; j < 5; j++) {
                if ((hex_num >> (i + j)) & 1) {
                    led.plot(j, i / 5);
                }
                else {
                    led.unplot(j, i / 5);
                }
            }
        }
    }
    
    // เพิ่มฟังก์ชันช่วยเหลือ (Helper Functions)
    function constrain(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    function getPort(pin_num: number): number {
        return 100 + pin_num
    }

    function getDigitalPin(pin_num: number): DigitalPin {
        return getPort(pin_num)
    }

    // เริ่มต้นเซ็นเซอร์อัลตราโซนิก

    //% blockId="ultrasonic_distance"
    //% block="Ultrasonic distance echo|%echo|trig|%trig|unit %unit"
    //% echo.defl=DigitalPin.P0
    //% trig.defl=DigitalWritePin.P1
    //% group="Ultrasonic Sensor"
    export function UltrasonicDistance(echo: DigitalPin, trig: DigitalWritePin, unit: DistanceUnit): number {
        let trigPin = getDigitalPin(trig)
        // ส่งสัญญาณพัลส์ (Pulse)
        pins.setPull(trigPin, PinPullMode.PullNone)
        pins.digitalWritePin(trigPin, 0)
        control.waitMicros(2)
        pins.digitalWritePin(trigPin, 1)
        control.waitMicros(10)
        pins.digitalWritePin(trigPin, 0)

        // อ่านสัญญาณพัลส์ (Pulse)
        let d = pins.pulseIn(echo, PulseValue.High)
        let distance = d / 58

        if (distance > 500) {
            distance = 500
        }

        switch (unit) {
            case DistanceUnit.CM:
                return Math.floor(distance)  // ซม.
            case DistanceUnit.INCH:
                return Math.floor(distance / 2.54)   // นิ้ว
            default:
                return 500
        }
    }
    // สิ้นสุดส่วนเซ็นเซอร์อัลตราโซนิก


    // เริ่มต้นส่วนรถไมโครบิต
    export enum RGBLights {
        //% blockId="Right_RGB" block="Right"
        RGB_R = 1,
        //% blockId="Left_RGB" block="Left"
        RGB_L = 2,
        //% blockId="ALL" block="All"
        ALL = 3
    }

    //% blockId=colorLight block="set LED %light color $color"
    //% color.shadow="colorNumberPicker"
    //% weight=65
    //% group="Microbit Car"
    export function colorLight(light: RGBLights, color: number): void {
        let r: number, g: number, b: number;
        r = (color >> 16) & 0xFF; // ดึงค่าสีแดง
        g = (color >> 8) & 0xFF;  // ดึงค่าสีเขียว
        b = color & 0xFF;         // ดึงค่าสีน้ำเงิน
        singleheadlights(light, r, g, b); // เรียกใช้ฟังก์ชันระดับล่างเพื่อตั้งค่าสีไฟ
    }


    //% inlineInputMode=inline
    //% blockId=singleheadlights block="set LED %light color R:%r G:%g B:%b"
    //% r.min=0 r.max=255
    //% g.min=0 g.max=255
    //% b.min=0 b.max=255
    //% weight=60
    //% group="Microbit Car"
    export function singleheadlights(light: RGBLights, r: number, g: number, b: number): void {
        let buf = pins.createBuffer(5);

        buf[0] = 0x00;
        buf[2] = r;
        buf[3] = g;
        buf[4] = b;

        if (light == 1) {
            buf[1] = 0x03;
            pins.i2cWriteBuffer(0x18, buf);
            basic.pause(10);
        }
        else if (light == 2) {
            buf[1] = 0x04;
            pins.i2cWriteBuffer(0x18, buf);
            basic.pause(10);
        }
        else if (light == 3) {
            buf[1] = 0x05;
            pins.i2cWriteBuffer(0x18, buf);
        }
    }

    export enum Direction {
        //% block="Forward" enumval=0
        forward,
        //% block="Backward" enumval=1
        backward,
        //% block="Left" enumval=2
        left,
        //% block="Right" enumval=3
        right
    }

    //% blockId=stopcar block="stop car"
    //% group="Microbit Car"
    //% weight=70
    export function stopcar(): void {
        let buf = pins.createBuffer(5);
        buf[0] = 0x00;                      // เติมให้เต็ม
        buf[1] = 0x01;		                // ล้อซ้าย
        buf[2] = 0x00;
        buf[3] = 0;	                        // ความเร็ว	
        pins.i2cWriteBuffer(0x18, buf);     // ส่งข้อมูล

        buf[1] = 0x02;		                // ล้อขวาหยุด
        pins.i2cWriteBuffer(0x18, buf);     // ส่งข้อมูล
    }

    //% blockId=motors block="ความเร็วล้อซ้าย %lspeed\\% | ความเร็วล้อขวา %rspeed\\%"
    //% lspeed.min=-100 lspeed.max=100
    //% rspeed.min=-100 rspeed.max=100
    //% weight=100
    //% group="Microbit Car"
    export function motors(lspeed: number = 0, rspeed: number = 0): void {
        let buf = pins.createBuffer(5);

        // จำกัดขอบเขตความเร็ว
        lspeed = constrain(lspeed, -100, 100);
        rspeed = constrain(rspeed, -100, 100);

        // ควบคุมล้อซ้าย
        if (lspeed === 0) {
            // หยุดล้อซ้ายอย่างเดียว
            buf[0] = 0x00;
            buf[1] = 0x01;  // ล้อซ้าย
            buf[2] = 0x00;  // หยุด
            buf[3] = 0;     // ความเร็วเป็น 0
            pins.i2cWriteBuffer(0x18, buf);
        }
        else if (lspeed > 0) {
            buf[0] = 0x00;
            buf[1] = 0x01;  // ล้อซ้าย
            buf[2] = 0x02;  // ไปข้างหน้า
            buf[3] = lspeed;
            pins.i2cWriteBuffer(0x18, buf);
        }
        else { // lspeed < 0 (ถอยหลัง)
            buf[0] = 0x00;
            buf[1] = 0x01;  // ล้อซ้าย
            buf[2] = 0x01;  // ถอยหลัง
            buf[3] = -lspeed; // ทำให้เป็นค่าบวก
            pins.i2cWriteBuffer(0x18, buf);
        }

        // ควบคุมล้อขวา
        if (rspeed === 0) {
            // หยุดล้อขวาอย่างเดียว
            buf[0] = 0x00;
            buf[1] = 0x02;  // ล้อขวา
            buf[2] = 0x00;  // หยุด
            buf[3] = 0;     // ความเร็วเป็น 0
            pins.i2cWriteBuffer(0x18, buf);
        }
        else if (rspeed > 0) {
            buf[0] = 0x00;
            buf[1] = 0x02;  // ล้อขวา
            buf[2] = 0x02;  // ไปข้างหน้า
            buf[3] = rspeed;
            pins.i2cWriteBuffer(0x18, buf);
        }
        else { // rspeed < 0 (ถอยหลัง)
            buf[0] = 0x00;
            buf[1] = 0x02;  // ล้อขวา
            buf[2] = 0x01;  // ถอยหลัง
            buf[3] = -rspeed; // ทำให้เป็นค่าบวก
            pins.i2cWriteBuffer(0x18, buf);
        }
    }

    //% blockId=moveTime block="move %dir | speed %speed | for %duration ms"
    //% weight=100
    //% speed.min=0 speed.max=100
    //% duration.shadow="timePicker"
    //% group="Microbit Car"
    export function moveTime(dir: Direction, speed: number = 50, duration: number = 0): void {

        let buf = pins.createBuffer(5);
        if (dir == 0) {
            buf[0] = 0x00;
            buf[1] = 0x01;
            buf[2] = 0x02;
            buf[3] = speed;
            pins.i2cWriteBuffer(0x18, buf);

            buf[1] = 0x02;
            pins.i2cWriteBuffer(0x18, buf);
        }
        if (dir == 1) {
            buf[0] = 0x00;
            buf[1] = 0x01;
            buf[2] = 0x01;
            buf[3] = speed;
            pins.i2cWriteBuffer(0x18, buf);

            buf[1] = 0x02;
            pins.i2cWriteBuffer(0x18, buf);
        }
        if (dir == 2) {
            buf[0] = 0x00;
            buf[1] = 0x01;
            buf[2] = 0x01;
            buf[3] = speed;
            pins.i2cWriteBuffer(0x18, buf);

            buf[1] = 0x02;
            buf[2] = 0x02;
            pins.i2cWriteBuffer(0x18, buf);
        }
        if (dir == 3) {
            buf[0] = 0x00;
            buf[1] = 0x01;
            buf[2] = 0x02;
            buf[3] = speed;
            pins.i2cWriteBuffer(0x18, buf);

            buf[1] = 0x02;
            buf[2] = 0x01;
            pins.i2cWriteBuffer(0x18, buf);
        }

        if (duration > 0) {
            basic.pause(duration);
            stopcar();
        }

    }

    export enum MbPins {
        //% block="Left" 
        Left = 0,
        //% block="Right" 
        Right = 1
    }

    //% blockId=tracking block="read tracking sensor %side"
    //% group="Microbit Car"
    //% weight=45
    export function tracking(side: MbPins): number {
        pins.setPull(AnalogPin.P0, PinPullMode.PullUp);
        pins.setPull(AnalogPin.P1, PinPullMode.PullUp);

        let left_tracking = pins.analogReadPin(AnalogPin.P1);
        let right_tracking = pins.analogReadPin(AnalogPin.P0);

        if (side == MbPins.Left) {
            return left_tracking;
        }
        else if (side == MbPins.Right) {
            return right_tracking;
        }
        else {
            return 0;
        }
    }

    // สิ้นสุดส่วนรถไมโครบิต


    // เริ่มต้นส่วนรีโมทคอนโทรลเลอร์ไมโครบิต

    export enum Rocker {
        //% block="X" enumval=0
        x,
        //% block="Y" enumval=1
        y,
        //% block="Key" enumval=2
        key,
    }


    //% blockId=joystick block="read joystick %dir"
    //% group="Remote Controller"
    export function joystick(dir: Rocker): number {
        switch (dir) {
            case Rocker.x:
                return pins.analogReadPin(AnalogPin.P1); // อ่านค่าจอยสติ๊กแกน X
            case Rocker.y:
                return pins.analogReadPin(AnalogPin.P2); // อ่านค่าจอยสติ๊กแกน Y
            case Rocker.key:
                pins.setPull(DigitalPin.P8, PinPullMode.PullUp); // ตั้งค่าขาปุ่มกดเป็นแบบ PullUp
                if (pins.digitalReadPin(DigitalPin.P8) === 0) return 1; // กดอยู่ คืนค่า 1
                else return 0; // ไม่ได้กด คืนค่า 0
            default:
                return 0;
        }
    }

    export enum Four_key {
        //% block="Up" enumval=0
        up,
        //% block="Down" enumval=1
        down,
        //% block="Left" enumval=2
        left,
        //% block="Right" enumval=3
        right
    }

    //% blockId=Four_bit_key block="read button %dir"
    //% group="Remote Controller"
    export function Four_bit_key(dir: Four_key): boolean {
        // ตั้งค่าความต้านทานแบบ PullUp ให้กับขา
        pins.setPull(DigitalPin.P13, PinPullMode.PullUp)
        pins.setPull(DigitalPin.P14, PinPullMode.PullUp)
        pins.setPull(DigitalPin.P15, PinPullMode.PullUp)
        pins.setPull(DigitalPin.P16, PinPullMode.PullUp)

        // อ่านสถานะปุ่มกดตามทิศทาง
        switch (dir) {
            case Four_key.up:
                return pins.digitalReadPin(DigitalPin.P16) === 0;
            case Four_key.down:
                return pins.digitalReadPin(DigitalPin.P14) === 0;
            case Four_key.left:
                return pins.digitalReadPin(DigitalPin.P13) === 0;
            case Four_key.right:
                return pins.digitalReadPin(DigitalPin.P15) === 0;
            default:
                return false; // หากเป็นค่าที่ไม่ถูกต้อง คืนค่า false
        }
    }


    export enum Vibration_motor_condition {
        //% block="ON" enumval=0
        on,
        //% block="OFF" enumval=1
        off,
    }

    // ควบคุมมอเตอร์สั่น
    //% blockId=Vibrating_machine block="vibration motor %condition"
    //% group="Remote Controller"
    export function Vibrating_machine(condition: Vibration_motor_condition): void {
        if (condition === Vibration_motor_condition.on) {
            pins.digitalWritePin(DigitalPin.P12, 1); // เปิดมอเตอร์สั่น
        } else {
            pins.digitalWritePin(DigitalPin.P12, 0); // ปิดมอเตอร์สั่น
        }
    }
    // สิ้นสุดส่วนรีโมทคอนโทรลเลอร์ไมโครบิต


    // ===== เริ่มต้นส่วนเดินตามเส้น PID (Line Tracking PID) =====

    // ตัวแปรเก็บค่า PID ภายใน
    let _pidKp: number = 25;
    let _pidKi: number = 0;
    let _pidKd: number = 15;
    let _pidBaseSpeed: number = 40;
    let _pidLastError: number = 0;
    let _pidIntegral: number = 0;
    let _pidRunning: boolean = false;
    let _pidThreshold: number = 500;
    let _pidJobId: number = 0;

    //% blockId=pid_set_params block="set PID Kp %kp Ki %ki Kd %kd"
    //% kp.defl=25 ki.defl=0 kd.defl=15
    //% inlineInputMode=inline
    //% group="Line Tracking PID"
    //% weight=100
    export function pidSetParams(kp: number, ki: number, kd: number): void {
        _pidKp = kp;
        _pidKi = ki;
        _pidKd = kd;
    }

    //% blockId=pid_set_base_speed block="set PID base speed %speed"
    //% speed.min=0 speed.max=100 speed.defl=40
    //% group="Line Tracking PID"
    //% weight=95
    export function pidSetBaseSpeed(speed: number): void {
        _pidBaseSpeed = constrain(speed, 0, 100);
    }

    //% blockId=pid_set_threshold block="set line tracking threshold %threshold"
    //% threshold.defl=500
    //% group="Line Tracking PID"
    //% weight=90
    export function pidSetThreshold(threshold: number): void {
        _pidThreshold = threshold;
    }

    //% blockId=pid_get_line_position block="get line position (Left -|Center 0|Right +)"
    //% group="Line Tracking PID"
    //% weight=85
    export function pidGetLinePosition(): number {
        pins.setPull(AnalogPin.P0, PinPullMode.PullUp);
        pins.setPull(AnalogPin.P1, PinPullMode.PullUp);

        let leftVal = pins.analogReadPin(AnalogPin.P1);
        let rightVal = pins.analogReadPin(AnalogPin.P0);

        // ค่าเซ็นเซอร์ต่ำ = อยู่บนเส้นดำ, ค่าสูง = อยู่บนพื้นขาว
        let leftOnLine = (leftVal < _pidThreshold) ? 1 : 0;
        let rightOnLine = (rightVal < _pidThreshold) ? 1 : 0;

        // คำนวณตำแหน่งเส้น: -1 = เส้นอยู่ทางซ้าย, 0 = ตรงกลาง, 1 = เส้นอยู่ทางขวา
        if (leftOnLine && rightOnLine) {
            return 0;           // อยู่ตรงกลางเส้น
        } else if (leftOnLine) {
            return -1;          // เส้นอยู่ทางซ้าย → ต้องเลี้ยวซ้าย
        } else if (rightOnLine) {
            return 1;           // เส้นอยู่ทางขวา → ต้องเลี้ยวขวา
        } else {
            return _pidLastError > 0 ? 2 : -2;  // หลุดเส้น → ใช้ทิศทางเดิมเข้มขึ้น
        }
    }

    // ฟังก์ชันภายในสำหรับคำนวณ PID แต่ละรอบ
    function _pidUpdate(): void {
        if (!_pidRunning) return;

        let error = pidGetLinePosition();
        _pidIntegral += error;
        // จำกัดค่า Integral ไม่ให้สะสมเกินไป
        _pidIntegral = constrain(_pidIntegral, -50, 50);

        let derivative = error - _pidLastError;
        let correction = (_pidKp * error) + (_pidKi * _pidIntegral) + (_pidKd * derivative);
        _pidLastError = error;

        let leftSpeed = _pidBaseSpeed + correction;
        let rightSpeed = _pidBaseSpeed - correction;

        // จำกัดค่าความเร็ว
        leftSpeed = constrain(leftSpeed, -100, 100);
        rightSpeed = constrain(rightSpeed, -100, 100);

        motors(leftSpeed, rightSpeed);
    }

    //% blockId=pid_start block="start PID line tracking"
    //% group="Line Tracking PID"
    //% weight=80
    export function pidStart(): void {
        _pidLastError = 0;
        _pidIntegral = 0;
        _pidRunning = true;
        _pidJobId = background.schedule(_pidUpdate, background.Thread.Priority, background.Mode.Repeat, 20);
    }

    //% blockId=pid_stop block="stop PID line tracking"
    //% group="Line Tracking PID"
    //% weight=75
    export function pidStop(): void {
        _pidRunning = false;
        if (_pidJobId > 0) {
            background.remove(background.Thread.Priority, _pidJobId);
            _pidJobId = 0;
        }
        stopcar();
    }

    //% blockId=pid_is_running block="is PID running?"
    //% group="Line Tracking PID"
    //% weight=70
    export function pidIsRunning(): boolean {
        return _pidRunning;
    }

    // ===== สิ้นสุดส่วนเดินตามเส้น PID =====


    // ===== เริ่มต้นส่วน AI (AI Vision) =====

    // ที่อยู่ I2C ของ HuskyLens
    const HUSKYLENS_I2C_ADDR = 0x32;

    // ตัวแปรเก็บข้อมูล AI
    let _aiConnected: boolean = false;
    let _aiLastX: number = 0;
    let _aiLastY: number = 0;
    let _aiLastW: number = 0;
    let _aiLastH: number = 0;
    let _aiLastId: number = 0;
    let _aiBlockCount: number = 0;

    export enum AIMode {
        //% block="Face Recognition"
        FaceRecognition = 0,
        //% block="Object Tracking"
        ObjectTracking = 1,
        //% block="Object Recognition"
        ObjectRecognition = 2,
        //% block="Line Tracking"
        LineTracking = 3,
        //% block="Color Recognition"
        ColorRecognition = 4,
        //% block="Tag Recognition"
        TagRecognition = 5
    }

    // ฟังก์ชันภายใน: สร้างคำสั่งและส่งผ่าน I2C
    function _aiSendCommand(commandId: number, data: number[] = []): void {
        let headerLen = 5; // Header(2) + Address(1) + DataLength(1) + Command(1)
        let totalLen = headerLen + data.length + 1; // +1 สำหรับ checksum
        let buf = pins.createBuffer(totalLen);

        buf[0] = 0x55; // Header byte 1
        buf[1] = 0xAA; // Header byte 2
        buf[2] = 0x11; // Address
        buf[3] = data.length;
        buf[4] = commandId;

        for (let i = 0; i < data.length; i++) {
            buf[5 + i] = data[i];
        }

        // คำนวณ checksum
        let checksum = 0;
        for (let i = 0; i < totalLen - 1; i++) {
            checksum += buf[i];
        }
        buf[totalLen - 1] = checksum & 0xFF;

        pins.i2cWriteBuffer(HUSKYLENS_I2C_ADDR, buf);
        basic.pause(50);
    }

    // ฟังก์ชันภายใน: อ่านข้อมูลกลับจาก AI
    function _aiReadResponse(): boolean {
        let buf = pins.i2cReadBuffer(HUSKYLENS_I2C_ADDR, 16);
        if (buf[0] === 0x55 && buf[1] === 0xAA) {
            _aiBlockCount = buf[3];
            if (_aiBlockCount > 0) {
                _aiLastX = (buf[6] << 8) | buf[5];
                _aiLastY = (buf[8] << 8) | buf[7];
                _aiLastW = (buf[10] << 8) | buf[9];
                _aiLastH = (buf[12] << 8) | buf[11];
                _aiLastId = (buf[14] << 8) | buf[13];
            }
            return true;
        }
        return false;
    }

    //% blockId=ai_connect block="connect AI camera (HuskyLens)"
    //% group="AI Vision"
    //% weight=100
    export function aiConnect(): void {
        _aiSendCommand(0x2C); // คำสั่ง Knock
        basic.pause(100);
        _aiConnected = _aiReadResponse();
    }

    //% blockId=ai_is_connected block="is AI camera connected?"
    //% group="AI Vision"
    //% weight=95
    export function aiIsConnected(): boolean {
        return _aiConnected;
    }

    //% blockId=ai_set_mode block="set AI mode to %mode"
    //% group="AI Vision"
    //% weight=90
    export function aiSetMode(mode: AIMode): void {
        _aiSendCommand(0x2D, [mode]); // คำสั่ง Switch Algorithm
        basic.pause(100);
    }

    //% blockId=ai_request_data block="request data from AI camera"
    //% group="AI Vision"
    //% weight=85
    export function aiRequestData(): void {
        _aiSendCommand(0x20); // คำสั่ง Request
        basic.pause(50);
        _aiReadResponse();
    }

    //% blockId=ai_is_detected block="is object detected by AI?"
    //% group="AI Vision"
    //% weight=80
    export function aiIsDetected(): boolean {
        return _aiBlockCount > 0;
    }

    //% blockId=ai_get_x block="detected object X position"
    //% group="AI Vision"
    //% weight=75
    export function aiGetX(): number {
        return _aiLastX;
    }

    //% blockId=ai_get_y block="detected object Y position"
    //% group="AI Vision"
    //% weight=74
    export function aiGetY(): number {
        return _aiLastY;
    }

    //% blockId=ai_get_width block="detected object width"
    //% group="AI Vision"
    //% weight=73
    export function aiGetWidth(): number {
        return _aiLastW;
    }

    //% blockId=ai_get_height block="detected object height"
    //% group="AI Vision"
    //% weight=72
    export function aiGetHeight(): number {
        return _aiLastH;
    }

    //% blockId=ai_get_id block="detected object ID"
    //% group="AI Vision"
    //% weight=71
    export function aiGetId(): number {
        return _aiLastId;
    }

    //% blockId=ai_get_count block="number of detected objects"
    //% group="AI Vision"
    //% weight=70
    export function aiGetCount(): number {
        return _aiBlockCount;
    }

    //% blockId=ai_learn_once block="teach AI camera to recognize ID %id"
    //% id.defl=1
    //% group="AI Vision"
    //% weight=65
    export function aiLearnOnce(id: number): void {
        _aiSendCommand(0x36, [id]); // คำสั่ง Learn Once
        basic.pause(200);
    }

    //% blockId=ai_forget_all block="forget all learned data from AI camera"
    //% group="AI Vision"
    //% weight=60
    export function aiForgetAll(): void {
        _aiSendCommand(0x37); // คำสั่ง Forget
        basic.pause(200);
    }

    //% blockId=ai_follow_object block="follow object at speed %speed"
    //% speed.min=0 speed.max=100 speed.defl=40
    //% group="AI Vision"
    //% weight=55
    export function aiFollowObject(speed: number): void {
        aiRequestData();
        if (!aiIsDetected()) {
            stopcar();
            return;
        }

        // หน้าจอ HuskyLens กว้าง 320 px จุดกลาง = 160
        let centerX = 160;
        let error = _aiLastX - centerX;

        // คำนวณแรงบิดเลี้ยว
        let turnPower = (error * speed) / centerX;
        let leftSpeed = speed + turnPower;
        let rightSpeed = speed - turnPower;

        leftSpeed = constrain(leftSpeed, -100, 100);
        rightSpeed = constrain(rightSpeed, -100, 100);

        motors(leftSpeed, rightSpeed);
    }

    // ===== สิ้นสุดส่วน AI =====

}