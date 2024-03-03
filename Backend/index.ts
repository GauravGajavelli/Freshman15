var express = require('express');
var app = express();
var cors = require('cors');
app.use(cors());
// For parsing application/json, increased size to get around pesky stuff
    // app.use(.json());
app.use(express.json({limit: '200mb'}));
// For parsing application/x-www-form-urlencoded
    // app.use(.urlencoded({ extended: true }));
app.use(express.urlencoded({limit: '200mb', extended: true}));

var bon = require('./endpoints.ts');
app.use('/',bon);

app.listen(3000);