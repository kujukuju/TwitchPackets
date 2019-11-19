/**
 * Created by Trent on 5/8/2019.
 */

'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

const rootPath = path.join(__dirname, 'test');
const libraryRootPath = path.join(__dirname, 'public');

const app = express();

app.use(express.static(libraryRootPath));
app.use(express.static(rootPath));

const PORT = 80;
app.listen(PORT);

console.log('Listening on port ' + PORT);