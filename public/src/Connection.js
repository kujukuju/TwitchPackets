/**
 * Created by Trent on 11/4/2019.
 */

'use strict';

class Connection {
    static _socket = null;
    static _username = null;
    static _clientID = null;
    static _secret = null;
    static _refreshToken = null;

    static connect(username, clientID, secret, refreshToken, code) {
        const createNewSocket = () => {
            console.log('Connecting to new socket...');
            Connection._socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            Connection._socket.addEventListener('message', event => Connection._onMessage(event));
            Connection._socket.addEventListener('error', event => Connection._onError(event));
            Connection._socket.addEventListener('open', () => Connection._onOpen(username, clientID, secret, refreshToken, code));
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

    static _onOpen(username, clientID, secret, refreshToken, code) {
        console.log('Socket opened. ' + username + ' ' + clientID);

        // I want to be able to reconnect without providing inputs
        username = username || Connection._username;
        clientID = clientID || Connection._clientID;
        secret = secret || Connection._secret;
        refreshToken = refreshToken || Connection._refreshToken;

        localStorage.setItem('username-input', username || '');
        localStorage.setItem('client-id-input', clientID || '');
        localStorage.setItem('secret-token-input', secret || '');
        localStorage.setItem('refresh-token-input', refreshToken || '');

        const responseProcessor = (response) => {
            const accessToken = response.access_token;
            if (!accessToken) {
                console.error('Received a response without an access token. ', response);
                return;
            }

            Connection._username = username;
            Connection._clientID = clientID;
            Connection._secret = secret;
            Connection._refreshToken = response.refresh_token;

            document.getElementById('refresh-token-input').value = Connection._refreshToken;
            localStorage.setItem('refresh-token-input', Connection._refreshToken);

            if (code) {
                window.location = window.location.origin;
                return;
            }

            console.log('||||||PASS oauth:' + accessToken + '||||||');
            console.log('||||||NICK ' + Connection._username + '||||||');
            Connection._socket.send('PASS oauth:' + accessToken);
            Connection._socket.send('NICK ' + Connection._username);
        };

        if (refreshToken) {
            Authenticate.refresh(clientID, secret, refreshToken).then(response => {
                console.log('Refresh response: ', response);
                responseProcessor(response);
            }).catch(error => {
                console.error('Something went wrong completing your refresh request. ', error);
            });

            return;
        }

        Authenticate.authenticate(clientID, secret, code).then(response => {
            console.log('Authentication response: ', response);
            responseProcessor(response);
        }).catch(error => {
            console.error('Something went wrong completing your authentication request. ', error);
        });
    }

    static _onClose() {
        console.log('Socket closed.');
    }
}