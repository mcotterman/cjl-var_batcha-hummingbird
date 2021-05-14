let mbId = "1"
const isVba = false;

radio.onReceivedString(function (receivedString) {
    handleMessage(receivedString);
    // basic.showString(receivedString);
})
radio.setGroup(27)

/*
    Servo List
    You do not need to add or remove any servos, but you can alter the max/min if needed

    stype: s (position) | c (continuous rotation)
    max/min: Clamp rotation speed or position
        rotation extremes: full reverse = -100, full forward = 100
        position extremes: 0 - 180
*/
let servos = [
    {
        port: "1",
        stype: "r",
        pin: FourPort.One,
        state: 0,
        min: -100,
        max: 100,
        fudge: 0,
        invert: false
    },
        {
        port: "2",
        pin: FourPort.Two,
        stype: "r",
        state: 0,
        min: -100,
        max: 100,
        fudge: 0,
        invert: false
    },
    {
        port: "3",
        pin: FourPort.Three,
        stype: "p",
        state: 0,
        min: 10,
        max: 150,
        fudge: 0,
        invert: false
    },
    {
        port: "4",
        pin: FourPort.Four,
        stype: "p",
        state: 0,
        min: 10,
        max: 150,
        fudge: 0,
        invert: false
    }
]

// led.enable(false)
let leds = [
    {
        port: "1",
        state: 0,
        pin: ThreePort.One
    },
    {
        port: "2",
        state: 0,
        pin: ThreePort.Two
    },
    {
        port: "3",
        state: 0,
        pin: ThreePort.Three
    }
]
let trileds = [
    {
        port: "1",
        redState: 0,
        greenState: 0,
        blueState: 0,
        pin: TwoPort.One
    },
    {
        port: "2",
        redState: 0,
        greenState: 0,
        blueState: 0,
        pin: TwoPort.Two
    }
]

let robots = [
    {
        id: "1",
        fudge: 5,
        leftMotor: {
            pin: FourPort.Two,
            rotateForward: true
        },
        rightMotor: {
            pin: FourPort.One,
            rotateForward: false
        }
    }
]

let botheads = [
    {
        id: "1",
        horizontal: {
            pin: FourPort.One,
            min: 0,
            max: 45,
            center: 22,
            current: 22,
            inverse: false,
            increment: 2
        },
        vertical: {
            pin: FourPort.Two,
            min: 150,
            max: 180,
            center: 160,
            current: 160,
            inverse: false,
            increment: 1
        }
    }
]

/* Variables
Allows RMB to set variables that can then be read by loops to update StringMap
*/


let cmdVars = [[{}]];

let isRunning = false;

// function getRmbVar (key: string) {
//     const item = rmbVars.find(function (rVar: any, index: number) {
//         return rVar.key == key;
//     });
//     return item ? item.val : "0";
// }

hummingbird.startHummingbird()
let debug = 0;

for (let i = 0; i < 3; i++) {
    controlLed("1", 100)
    basic.pause(300)
    controlLed("1", 0)
    basic.pause(300)
}

function controlLed(id: string, newState: number) {
    let foundLed = leds.find(function (value: any, index: number) {
        return value.port == id
    })
    if(foundLed) {
        if(newState != foundLed.state) {
            hummingbird.setLED(foundLed.pin, newState)
            foundLed.state = newState
        }
        return true
    }
    return false
}

function controlTriLed(id: string, newState: string) {
    let foundTriLed = trileds.find(function (value: any, index: number) {
        return value.port == id
    })
    if(foundTriLed) {
        let newStates = {
            red: convertLed(newState[0]),
            green: convertLed(newState[1]),
            blue: convertLed(newState[2])
        }
        if(newStates.red != foundTriLed.redState || newStates.green != foundTriLed.greenState || newStates.blue != foundTriLed.blueState) {
            hummingbird.setTriLED(TwoPort.One, newStates.red, newStates.green, newStates.blue)
            foundTriLed.redState = newStates.red
            foundTriLed.greenState = newStates.green
            foundTriLed.blueState = newStates.blue
        }
        // basic.showString(`${newStates.red}${newStates.green}${newStates.blue}`)
        return true
    }
    return false
}

function controlServo(id: string, stype: string, newState: number) {
    let foundServo = servos.find(function (value: any, index: number) {
        return (value.port == id && value.stype == stype)
    })
    if(foundServo) {
        if(newState != foundServo.state) {
            if(stype == "p") {
                newState = Math.constrain((foundServo.invert ? 180 - newState : newState), foundServo.min, foundServo.max)
                hummingbird.setPositionServo(foundServo.pin, newState)
            } else {
                newState = Math.constrain((foundServo.invert ? newState * -1 : newState), foundServo.min, foundServo.max)
                if(newState < 0 && newState >= foundServo.min) {
                    newState -= foundServo.fudge;
                }
                hummingbird.setRotationServo(foundServo.pin, newState)
            }
            foundServo.state = newState
        }
        return true
    }
    return false
}

function controlBot(id: string, direction: string, speed: number) {
    let foundBot = robots.find(function (value: any, index: number) {
        return (value.id == id)
    })
    if(foundBot) {
        switch(direction) {
            case 'f':
                hummingbird.setRotationServo(foundBot.leftMotor.pin, foundBot.leftMotor.rotateForward ? speed : ((speed + foundBot.fudge) * -1))
                hummingbird.setRotationServo(foundBot.rightMotor.pin, foundBot.rightMotor.rotateForward ? speed : ((speed + foundBot.fudge) * -1))
                break;
            case 'b':
                hummingbird.setRotationServo(foundBot.leftMotor.pin, foundBot.leftMotor.rotateForward ? (speed + foundBot.fudge) * -1 : speed)
                hummingbird.setRotationServo(foundBot.rightMotor.pin, foundBot.rightMotor.rotateForward ? (speed + foundBot.fudge) * -1 : speed)
                break;
            case 'r':
                hummingbird.setRotationServo(foundBot.leftMotor.pin, foundBot.leftMotor.rotateForward ? speed: (speed + foundBot.fudge) * -1)
                hummingbird.setRotationServo(foundBot.rightMotor.pin, foundBot.rightMotor.rotateForward ? (speed + foundBot.fudge) * -1 : speed)
                break;
            case 'l':
                hummingbird.setRotationServo(foundBot.leftMotor.pin, foundBot.leftMotor.rotateForward ? (speed + foundBot.fudge) * -1 : speed)
                hummingbird.setRotationServo(foundBot.rightMotor.pin, foundBot.rightMotor.rotateForward ? speed : (speed + foundBot.fudge) * -1)
                break;
            case 's':
                hummingbird.setRotationServo(foundBot.leftMotor.pin, 0)
                hummingbird.setRotationServo(foundBot.rightMotor.pin, 0)
                break;
        }
    } else {
        basic.showString(`Robot ${id} not found`)
    }
}

function controlBotHead(id: string, direction: string) {
    let foundBot = botheads.find(function (value: any, index: number) {
        return (value.id == id)
    })
    if(foundBot) {
        // basic.showString("*h*")
        switch(direction) {
            case 'u':
                if(foundBot.vertical.current < foundBot.vertical.max && foundBot.vertical.current > foundBot.vertical.min) {
                    // basic.showString("*u*")
                    foundBot.vertical.current = foundBot.vertical.inverse ? foundBot.vertical.current - foundBot.vertical.increment : foundBot.vertical.current + foundBot.vertical.increment;
                    hummingbird.setPositionServo(foundBot.vertical.pin, foundBot.vertical.current);
                }
                break;
            case 'd':
                if(foundBot.vertical.current < foundBot.vertical.max && foundBot.vertical.current > foundBot.vertical.min) {
                    foundBot.vertical.current = foundBot.vertical.inverse ? foundBot.vertical.current + foundBot.vertical.increment : foundBot.vertical.current - foundBot.vertical.increment;
                    hummingbird.setPositionServo(foundBot.vertical.pin, foundBot.vertical.current);
                }
                break;
            case 'l':
                if(foundBot.horizontal.current < foundBot.horizontal.max && foundBot.horizontal.current > foundBot.horizontal.min) {
                    foundBot.horizontal.current = foundBot.horizontal.inverse ? foundBot.horizontal.current + foundBot.horizontal.increment : foundBot.horizontal.current - foundBot.horizontal.increment;
                    hummingbird.setPositionServo(foundBot.horizontal.pin, foundBot.horizontal.current);
                }
                break;
            case 'r':
                if(foundBot.horizontal.current < foundBot.horizontal.max && foundBot.horizontal.current > foundBot.horizontal.min) {
                    foundBot.horizontal.current = foundBot.horizontal.inverse ? foundBot.horizontal.current - foundBot.horizontal.increment : foundBot.horizontal.current + foundBot.horizontal.increment;
                    hummingbird.setPositionServo(foundBot.horizontal.pin, foundBot.horizontal.current);
                }
                break;
            case 'c':
                    hummingbird.setPositionServo(foundBot.horizontal.pin, foundBot.horizontal.center);
                    hummingbird.setPositionServo(foundBot.vertical.pin, foundBot.vertical.center);
                    foundBot.horizontal.current = foundBot.horizontal.center;
                    foundBot.vertical.current = foundBot.vertical.center;

                break;
        }
    } else {
        basic.showString(`Robot ${id} not found`)
    }
}

function convertLed(value: string) {
    return value.toLowerCase() == "f" ? 100 : parseInt(value) * 10
}

function controlVariable(id: string, data: string) {
    const d = data.split('=');
    if(d.length === 2) {
        if(d[0] == 'bs') {
            isRunning = d[1] == '1' ? true : false;
            if(!isRunning) cmdVars = [[{}]];
        }
    } 
}

function controlCommands(gid: string, data: string) {
    cmdVars[parseInt(gid)][parseInt(data[0])] = {
        deviceType: data[1],
        deviceId: data[2],
        value: data.substr(3,100)
    }
}

function handleMessage(msg: string) {
    if(mbId == msg[0]) {
        let dId = msg[2]
        switch(msg[1]) {
            case "l":
                controlLed(dId, convertLed(msg[3]));
                break;
            case "t":
                controlTriLed(dId, msg.substr(3,3));
                break;
            case "p":
            case "r":
                controlServo(dId, msg[1], parseInt(msg.substr(3,4)));
                break;
            case "b":
                controlBot(dId, msg[3].toLowerCase(), parseInt(msg.substr(4,4)));
                break;
            case "h":
                controlBotHead(dId, msg[3].toLowerCase());
                break;
            case "v":
                controlVariable(dId, msg.substr(2,100));
            case "z":
                controlCommands(dId, msg.substr(3,100));
        }
    }
    if(debug === 1) {
        basic.showString(msg);
    }
}

input.onButtonPressed(Button.A, function () {
    if(debug === 1) {
        debug = 0;
    } else {
        debug = 1;
    }
    basic.showNumber(debug);
    basic.pause(1000);
    basic.clearScreen();
    // if(isRunning) {
    //     isRunning = false;
    // } else {
    //     isRunning = true;
    // }
})

if(isVba) {
    //Group 0
    basic.forever(function () {
        if(isRunning) {
            if(cmdVars[0] && cmdVars[0][0]) {
                cmdVars[0].forEach(function (cmd: any) {
                if(cmd.deviceType && cmd.deviceId && cmd.value){
                    if(cmd.deviceType == 'x') {
                        basic.pause(parseInt(cmd.value));
                    } else {
                        //    console.log(cmd);
                        basic.showString(cmd.value);
                        //    handleMessage(`${mbId}${cmd.deviceType}${cmd.deviceId}${cmd.value}`);
                    }
                } 
                });
            }
        } else {
            basic.pause(500);
            // Add any position cleanup for the stop state here
        }
    })

    //Group 1
    basic.forever(function () {
        if(isRunning) {
            if(cmdVars[1] && cmdVars[1][0]) {
                cmdVars[1].forEach(function (cmd: any) {
                if(cmd.deviceType && cmd.deviceId && cmd.value){
                    if(cmd.deviceType == 'x') {
                        basic.pause(parseInt(cmd.value));
                    } else {
                        //    console.log(cmd);
                        basic.showString(cmd.value);
                        //    handleMessage(`${mbId}${cmd.deviceType}${cmd.deviceId}${cmd.value}`);
                    }
                } 
                });
            }
        } else {
            basic.pause(500);
            // Add any position cleanup for the stop state here
        }
    })

    //Group 2
    basic.forever(function () {
        if(isRunning) {
            if(cmdVars[2] && cmdVars[2][0]) {
                cmdVars[2].forEach(function (cmd: any) {
                if(cmd.deviceType && cmd.deviceId && cmd.value){
                    if(cmd.deviceType == 'x') {
                        basic.pause(parseInt(cmd.value));
                    } else {
                        //    console.log(cmd);
                        basic.showString(cmd.value);
                        //    handleMessage(`${mbId}${cmd.deviceType}${cmd.deviceId}${cmd.value}`);
                    }
                } 
                });
            }
        } else {
            basic.pause(500);
            // Add any position cleanup for the stop state here
        }
    })
}

basic.showString(mbId);