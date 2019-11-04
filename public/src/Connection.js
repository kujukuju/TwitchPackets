/**
 * Created by Trent on 11/4/2019.
 */

'use strict';

class Connection {
    static _socket = null;

    static connect(username, clientID, token) {
        const createNewSocket = () => {
            console.log('Connecting to new socket...');
            Connection._socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            Connection._socket.addEventListener('message', event => Connection._onMessage(event));
            Connection._socket.addEventListener('error', event => Connection._onError(event));
            Connection._socket.addEventListener('open', () => Connection._onOpen(username, clientID, token));
            Connection._socket.addEventListener('close', () => Connection._onClose());
        };

        if (Connection._socket && !(Connection._socket.readyState === 2 || Connection._socket.readyState === 3)) {
            console.log('Disconnecting from current socket...');
            Connection._socket.addEventListener('close', () => {
                createNewSocket();
            });
            Connection._socket.close();
        } else {
            createNewSocket();
        }
    }

    static send(message) {
        if (!Connection._socket || Connection._socket.readyState !== 1) {
            console.log('Tried to send a message when the socket wasn\'t ready. ', message);
            return;
        }

        Connection._socket.send(message);
    }

    static _onMessage(event) {
        console.log('Socket message: ', event);
    }

    static _onError(event) {
        console.error('Socket error: ', event);
    }

    static _onOpen(username, clientID, token) {
        console.log('Socket opened. ' + username + ' ' + clientID);

        Authenticate.authenticate(clientID, token).then(response => {
            const accessToken = response.access_token;
            console.log('||||||PASS oauth:' + accessToken + '||||||');
            console.log('||||||NICK ' + username + '||||||');
            Connection._socket.send('PASS oauth:' + accessToken);
            Connection._socket.send('NICK ' + username);
        }).catch(error => {
            console.error('Something went wrong completing your authentication request. ', error);
        });
    }

    static _onClose() {
        console.log('Socket closed.');
    }
}