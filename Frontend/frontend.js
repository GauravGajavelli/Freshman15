var express = require("express");
var app = express();
var favicon = require('serve-favicon');
var path = require('path');
app.use('/static', express.static("public"));
app.use(favicon(path.join(__dirname, 'favicon.ico')))


app.listen(8080);