/**
 * Created by Trent on 11/4/2019.
 */

'use strict';

/*
class Connection {
    static _socket = null;
    static _username = null;
    static _hostUsername = null;
    static _clientID = null;
    static _secret = null;
    static _refreshToken = null;

    static connect(username, hostUsername, clientID, secret, refreshToken, code) {
        if (Connection._socket && !(Connection._socket.readyState === 2 || Connection._socket.readyState === 3)) {
            console.log('Disconnecting from current socket...');
            Connection._socket.close();
        } else {
            Connection._createNewSocket(username, hostUsername, clientID, secret, refreshToken, code);
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

    static _onOpen(username, hostUsername, clientID, secret, refreshToken, code) {
        document.getElementById('download-button').disabled = true;
        document.getElementById('download-button').className = 'disabled';

        // I want to be able to reconnect without providing inputs
        username = username || Connection._username;
        hostUsername = hostUsername || Connection._hostUsername;
        clientID = clientID || Connection._clientID;
        secret = secret || Connection._secret;
        refreshToken = refreshToken || Connection._refreshToken;

        console.log('Socket opened. ' + username + ' ' + clientID);

        localStorage.setItem('username-input', username || '');
        localStorage.setItem('host-username-input', hostUsername || '');
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
            Connection._hostUsername = hostUsername;
            Connection._clientID = clientID;
            Connection._secret = secret;
            Connection._refreshToken = response.refresh_token;

            document.getElementById('refresh-token-input').value = Connection._refreshToken;
            localStorage.setItem('refresh-token-input', Connection._refreshToken);

            if (code) {
                window.location = window.location.origin;
                return;
            }

            const content = Connection.getCredentialFileContent();
            const blob = new Blob([JSON.stringify(content)], {type: 'text/plain'});
            document.getElementById('download-button').href = window.URL.createObjectURL(blob);
            document.getElementById('download-button').download = Connection._username + '.json';
            document.getElementById('download-button').disabled = false;
            document.getElementById('download-button').className = '';

            console.log('||||||PASS oauth:' + accessToken + '||||||');
            console.log('||||||NICK ' + Connection._username + '||||||');
            console.log('||||||HOST ' + Connection._hostUsername + '||||||');
            Connection.send('PASS oauth:' + accessToken);
            Connection.send('NICK ' + Connection._username);
            Connection.send('JOIN #' + Connection._hostUsername);
            Connection.send('PRIVMSG #' + Connection._hostUsername + ' :Connection initialized.');
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

    static getCredentialFileContent() {
    }

    static _onClose() {
        console.log('Socket closed.');
        Connection._createNewSocket();
    }

    static _createNewSocket(username, hostUsername, clientID, secret, refreshToken, code) {
        console.log('Connecting to new socket...');
        Connection._socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
        Connection._socket.addEventListener('message', event => Connection._onMessage(event));
        Connection._socket.addEventListener('error', event => Connection._onError(event));
        Connection._socket.addEventListener('open', () => Connection._onOpen(username, hostUsername, clientID, secret, refreshToken, code));
        Connection._socket.addEventListener('close', () => Connection._onClose());
    }
}
*/