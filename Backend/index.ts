var express = require('express');
var app = express();
var cors = require('cors');
app.use(cors());

var bon = require('./bone_scraper.ts');
app.use('/',bon);

app.listen(3000);