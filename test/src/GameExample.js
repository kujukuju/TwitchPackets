/**
 * Created by Trent on 11/18/2019.
 */

'use strict';

class GameExample {
    // your name will be an empty string just to make things easy
    static HARDCODED_CLIENT_USERNAME = '';

    static initialize() {
        TwitchPackets.addListener(TwitchPackets.EVENT_MESSAGE, event => {
            const username = event.username;
            const message = event.message;

            PacketProcessor.processPacket(username, message);
        });

        GameRenderer.initialize();

        // start loops
        GameLogic.update();
        GameRenderer.render();

        // process inputs
        window.addEventListener('keydown', (event) => {
            if (!TwitchPackets.isConnected()) {
                return;
            }

            switch (event.keyCode) {
                case 87: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_W, true);
                } break;

                case 65: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_A, true);
                } break;

                case 83: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_S, true);
                } break;

                case 68: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_D, true);
                } break;
            }
        });

        window.addEventListener('keyup', (event) => {
            if (!TwitchPackets.isConnected()) {
                return;
            }

            switch (event.keyCode) {
                case 87: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_W, false);
                } break;

                case 65: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_A, false);
                } break;

                case 83: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_S, false);
                } break;

                case 68: {
                    GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setInput(Player.INPUT_D, false);
                } break;
            }
        });
    }
}

class GameLogic {
    static _playerListByName = {};

    static update() {
        const start = Date.now();

        // set your player to active since we wont be receiving packets for you
        GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).setActive();

        // update players
        const playerNames = Object.keys(GameLogic._playerListByName);
        for (let i = 0; i < playerNames.length; i++) {
            GameLogic._playerListByName[playerNames[i]].update();
        }

        // send packets after updating everyone
        GameLogic.getPlayer(GameExample.HARDCODED_CLIENT_USERNAME).sendPackets();

        // clean up inactive players
        for (let i = 0; i < playerNames.length; i++) {
            if (GameLogic._playerListByName[playerNames[i]].isInactive()) {
                delete GameLogic._playerListByName[playerNames[i]];
            }
        }

        // very quickly and poorly set the logic loop delay based on immediate performance
        const delay = Math.max(17 - (Date.now() - start), 0);
        setTimeout(GameLogic.update, delay);
    }

    static getPlayer(username) {
        GameLogic._playerListByName[username] = GameLogic._playerListByName[username] || new Player(username);
        return GameLogic._playerListByName[username];
    }
}

class GameRenderer {
    static _canvas = null;
    static _context = null;
    static _dimensions = [0, 0];

    static render() {
        GameRenderer._context.clearRect(0, 0, GameRenderer._dimensions[0], GameRenderer._dimensions[1]);
        GameRenderer._context.fillStyle = '#2a2a2a';
        GameRenderer._context.fillRect(0, 0, GameRenderer._dimensions[0], GameRenderer._dimensions[1]);

        // do game render stuff
        const playerNames = Object.keys(GameLogic._playerListByName);
        for (let i = 0; i < playerNames.length; i++) {
            GameLogic._playerListByName[playerNames[i]].render(GameRenderer._context);
        }

        // set the delay to re-animate
        window.requestAnimationFrame(GameRenderer.render);
    }

    static getDimensions() {
        return GameRenderer._dimensions;
    }

    static initialize() {
        GameRenderer._canvas = document.getElementById('canvas');
        GameRenderer._context = GameRenderer._canvas.getContext('2d');

        GameRenderer._resize();
        window.addEventListener('resize', GameRenderer._resize);
    }

    static _resize() {
        const bounds = GameRenderer._canvas.getBoundingClientRect();
        GameRenderer._dimensions[0] = bounds.width;
        GameRenderer._dimensions[1] = bounds.height;
        GameRenderer._canvas.width = bounds.width;
        GameRenderer._canvas.height = bounds.height;
    }
}

class Player {
    static INACTIVE_DELAY = 5000;
    static INPUT_W = 0;
    static INPUT_A = 1;
    static INPUT_S = 2;
    static INPUT_D = 3;

    _username = null;
    _lastActiveTime = 0;
    _position = [0, 0];
    _velocity = [0, 0];
    _inputs = [false, false, false, false];

    constructor(username) {
        this._username = username;
        this._lastActiveTime = Date.now();
        this._position[0] = Math.random() - 0.5;
        this._position[1] = Math.random() - 0.5;
    }

    update() {
        if (this._inputs[Player.INPUT_W]) {
            this._position[1] -= 0.01;
        }
        if (this._inputs[Player.INPUT_S]) {
            this._position[1] += 0.01;
        }
        if (this._inputs[Player.INPUT_A]) {
            this._position[0] -= 0.01;
        }
        if (this._inputs[Player.INPUT_D]) {
            this._position[0] += 0.01;
        }
    }

    sendPackets() {
        if (TwitchPackets.canSendPacketImmediately()) {
            console.log('sending packet');
            TwitchPackets.send(PacketProcessor.createPositionPacket(this._position[0], this._position[1]) + PacketProcessor.createVelocityPacket(this._velocity[0], this._velocity[1]));
        }
    }

    render(context) {
        const dimensions = GameRenderer.getDimensions();
        const x = (this._position[0] + 0.5) * dimensions[0];
        const y = (this._position[1] + 0.5) * dimensions[1];

        context.fillStyle = '#4dade4';
        context.moveTo(x, y);
        context.beginPath();
        context.arc(x, y, 8, 0, Math.PI * 2);
        context.fill();
        context.closePath();
    }

    setActive() {
        this._lastActiveTime = Date.now();
    }

    setPosition(x, y) {
        this._position[0] = x;
        this._position[1] = y;
    }

    setVelocity(x, y) {
        this._velocity[0] = x;
        this._velocity[1] = y;
    }

    isInactive() {
        return Date.now() - this._lastActiveTime > Player.INACTIVE_DELAY;
    }

    setInput(key, value) {
        this._inputs[key] = value;
    }
}

class PacketProcessor {
    static PACKET_TYPE_POSITION = 0;
    static PACKET_TYPE_VELOCITY = 1;

    // there should ideally be logic in here to respect endianness
    static _buffer = new ArrayBuffer(4);
    static _floatBuffer = new Float32Array(PacketProcessor._buffer);
    static _intBuffer  = new Int32Array(PacketProcessor._buffer);

    static processPacket(username, packet) {
        const packetType = packet.charCodeAt(0);

        switch (packetType) {
            case PacketProcessor.PACKET_TYPE_POSITION: {
                // 1 character for the packet type, 2 characters for each float
                const x = PacketProcessor._getFloatFromString(packet.substring(1));
                const y = PacketProcessor._getFloatFromString(packet.substring(3));

                GameLogic.getPlayer(username).setActive();
                GameLogic.getPlayer(username).setPosition(x, y);

                console.log('pos', username, x, y);

                // continue the rest of the packet since we chain them together
                PacketProcessor.processPacket(username, packet.substring(5));
            } break;

            case PacketProcessor.PACKET_TYPE_VELOCITY: {
                // 1 character for the packet type, 2 characters for each float
                const x = PacketProcessor._getFloatFromString(packet.substring(1));
                const y = PacketProcessor._getFloatFromString(packet.substring(3));

                GameLogic.getPlayer(username).setActive();
                GameLogic.getPlayer(username).setVelocity(x, y);

                console.log('vel', username, x, y);

                // continue the rest of the packet since we chain them together
                PacketProcessor.processPacket(username, packet.substring(5));
            } break;

            default:
                break;
        }
    }

    static createPositionPacket(x, y) {
        const xCharacters = PacketProcessor._getCharactersFromFloat(x);
        const yCharacters = PacketProcessor._getCharactersFromFloat(y);

        return String.fromCharCode(PacketProcessor.PACKET_TYPE_POSITION) + xCharacters[0] + xCharacters[1] + yCharacters[0] + yCharacters[1];
    }

    static createVelocityPacket(x, y) {
        const xCharacters = PacketProcessor._getCharactersFromFloat(x);
        const yCharacters = PacketProcessor._getCharactersFromFloat(y);

        return String.fromCharCode(PacketProcessor.PACKET_TYPE_VELOCITY) + xCharacters[0] + xCharacters[1] + yCharacters[0] + yCharacters[1];
    }

    static _getCharactersFromFloat(value) {
        PacketProcessor._floatBuffer[0] = value;
        const intVal = PacketProcessor._intBuffer[0];
        const leftChar = String.fromCharCode((intVal & 0xffff0000) >> 16);
        const rightChar = String.fromCharCode(intVal & 0x0000ffff);

        return [leftChar, rightChar];
    }

    static _getFloatFromString(string) {
        const leftVal = string.charCodeAt(0);
        const rightVal = string.charCodeAt(1);
        PacketProcessor._intBuffer[0] = (leftVal << 16) | rightVal;

        return PacketProcessor._floatBuffer[0];
    }
}