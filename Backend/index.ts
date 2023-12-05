var express = require('express');
var app = express();

var bon = require('./bone_scraper.ts'); // HelloWorld router (try refreshing)
app.use('/',bon);

app.listen(3000);
