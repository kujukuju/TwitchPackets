/**
 * Created by Trent on 5/8/2019.
 */

'use strict';

const Cors = require('cors');
const express = require('express');
const fs = require('fs');
const path = require('path');

const rootPath = path.join(__dirname, 'test');
const librarySrcPath = path.join(__dirname, 'public', 'TwitchPackets.js');

const libsPath = path.join(rootPath, 'libs');
const libraryDstPath = path.join(libsPath, 'TwitchPackets.js');
if (fs.existsSync(libsPath)) {
    if (fs.existsSync(libraryDstPath)) {
        fs.unlinkSync(libraryDstPath);
    }

    fs.rmdirSync(libsPath);
}

fs.mkdirSync(libsPath);
fs.copyFileSync(librarySrcPath, libraryDstPath);

const app = express();

app.use(Cors());
app.use(express.static(rootPath));

const PORT = 80;
app.listen(PORT);

console.log('Listening on port ' + PORT);