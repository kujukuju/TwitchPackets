/**
 * Created by Trent on 11/4/2019.
 */

'use strict';

const axios = require('axios');
const tmi = require('tmi.js');

const authenticate = (clientID, secret) => {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.onload = () => {
            if (request.status !== 200) {
                console.log('Request completed with an incorrect status. ', request.status);
                return reject(request.responseText);
            }

            console.log('Authentication completed.');
            console.log(JSON.parse(request.responseText));
            return resolve(JSON.parse(request.responseText));
        };
        request.onerror = () => {
            return reject(request.responseText);
        };

        const params = 'client_id=' + clientID + '&client_secret=' + secret + '&grant_type=client_credentials&scope=chat:read+chat:edit+channel:moderate+whispers:read+whispers:edit+channel_editor';
        request.open('POST', 'https://id.twitch.tv/oauth2/token?' + params, true);
        request.send();
    });
};

Authenticate.authenticate('5gxwjxw413mhfwi5yl8u0rcx9qjsbv', 'spp9csejtxi1p5hqs8w2vuboyyxhym').then(response => {
    const token = response.access_token;
    console.log('Token: ' + token);

    const client = new tmi.Client({
        options: {
            debug: true,
        },
        connections: {
            reconnect: true,
            secure: true,
        },
        identity: {
            username: 'packettest',
            password: 'oauth:' + token,
        },
        channels: [
            'ekuju',
        ],
    });
    client.connect();
}).catch(error => console.error(error));