var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
const fs = require("fs");

var config = JSON.parse(fs.readFileSync("connectivity_config.json"));

const connection = new Connection(config);

connection.connect((err) => {
  if (err) {
    console.log('Connection Failed');
    throw err;
  }

  executeStatement();
});

connection.on('debug', function(text) {
    console.log(text)
  });

function executeStatement() {
  const request = new Request('select * from Users', (err, rowCount) => {
    if (err) {
      throw err;
    }

    console.log('DONE!');
    connection.close();
  });

  // Emits a 'DoneInProc' event when completed.
  request.on('row', (columns) => {
    columns.forEach((column) => {
      if (column.value === null) {
        console.log('NULL');
      } else {
        console.log(column.value);
      }
    });
  });

  request.on('done', (rowCount) => {
    console.log('Done is called!');
  });

  request.on('doneInProc', (rowCount, more) => {
    console.log(rowCount + ' rows returned');
  });

  // In SQL Server 2000 you may need: connection.execSqlBatch(request);
  connection.execSql(request);
}