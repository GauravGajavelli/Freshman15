var express = require('express');
var app = express();
var cors = require('cors');
app.use(cors());
// For parsing application/json
app.use(express.json());
// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

var bon = require('./bone_scraper.ts');
app.use('/',bon);

app.listen(3000);