/**
 * Created by Trent on 11/4/2019.
 */

'use strict';

window.onload = () => {
    document.getElementById('start-button').onclick = () => {
        const username = document.getElementById('username-input').value;
        const clientID = document.getElementById('client-id-input').value;
        const token = document.getElementById('secret-token-input').value;

        Connection.connect(username, clientID, token);
    };
};