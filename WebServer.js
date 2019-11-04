/**
 * Created by Trent on 5/8/2019.
 */

'use strict';

const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;

app.listen(PORT);

console.log('Listening on port ' + PORT);