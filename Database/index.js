var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var types = require('tedious').TYPES;
const fs = require("fs");
const { DateTime } = require("luxon");

var config = JSON.parse(fs.readFileSync("connectivity_config.json"));
let daysAgo = 0;
let prevDayta = outDatabase(daysAgo);
for (const day in prevDayta.validMenus) { // all validmenus
    for (const meal in prevDayta.meals[day]) { // all validmeals
        let foods = prevDayta.meals[day][meal];
        if (Object.keys(foods).length > 0) { // {} check
            // for (let i = 0; i < foods.length; i++) {
            //     let food = foods[i];
                const connection = new Connection(config);
                connection.connect((err) => {
                    if (err) {
                        console.log('Connection Failed');
                        throw err;
                    }
                    console.log("ONE TIME TWO TIME");
                    // console.log("Food: "+food);
                    console.log("Day: "+formattedDate(day));
                    console.log("Meal: "+meal);
                    importFoods(foods, day, meal, connection);
                });
            // }
        }
    }
}

function formattedDate (daysAgo) {
    let val = DateTime.now().minus({ days: daysAgo });
    let toRet = val.year+"-"+val.month.toString().padStart(2,'0')+"-"+val.day.toString().padStart(2,'0');
    console.log("Rug: "+toRet);
    return toRet;
}

function outDatabase(daysAgo) {
    let filepath = "../Backend/files/";
    let filename = formattedDate(daysAgo)+"_dayinfo";
    return JSON.parse(fs.readFileSync(filepath+filename+".json"));
}
function importFoods(food, day, meal, connection) {
    const request = new Request('exec insertFood (@json NVARCHAR(MAX), @date Date, @meal varchar(10))', (err, rowCount) => {
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

    request.on('done', (rowCount, more, rows) => {
      console.log('Done is called!');
    });

    request.addParameter('json', types.NVarChar, JSON.stringify(food));
    request.addParameter('date', types.Date, formattedDate(day));
    request.addParameter('meal', types.VarChar, meal);

    // In SQL Server 2000 you may need: connection.execSqlBatch(request);
    connection.execSql(request);
}

// https://stackoverflow.com/questions/18275386/how-to-automatically-delete-records-in-sql-server-after-a-certain-amount-of-time
    // So the storage scheme will be that EC2 will host the 
// Create a sproc for insertiont o reject duplciates used food id as id get rid of current table