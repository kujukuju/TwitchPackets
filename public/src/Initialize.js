/**
 * Created by Trent on 11/4/2019.
 */

'use strict';

const getURLParams = () => {
    const vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
        vars[key] = value;
    });

    return vars;
};

window.onload = () => {
    document.getElementById('username-input').value = localStorage.getItem('username-input') || '';
    document.getElementById('client-id-input').value = localStorage.getItem('client-id-input') || '';
    document.getElementById('secret-token-input').value = localStorage.getItem('secret-token-input') || '';
    document.getElementById('refresh-token-input').value = localStorage.getItem('refresh-token-input') || '';

    document.getElementById('start-button').onclick = () => {
        const params = getURLParams();

        const username = document.getElementById('username-input').value;
        const clientID = document.getElementById('client-id-input').value;
        const secret = document.getElementById('secret-token-input').value;
        const refreshToken = document.getElementById('refresh-token-input').value;
        const code = params.code || null;

        Connection.connect(username, clientID, secret, refreshToken, code);

        // const client = new tmi.Client({
        //     options: {
        //         debug: true,
        //     },
        //     connections: {
        //         reconnect: true,
        //         secure: true,
        //     },
        //     identity: {
        //         username: 'packettest',
        //         password: 'oauth:s4kw6ap1a232mrxbdjl3lozzva6183',
        //     },
        //     channels: [
        //         'ekuju',
        //     ],
        // });
        // client.connect();
    };
};