var Connection = require('tedious').Connection;
var Request = require('tedious').Request;

var types = require('tedious').TYPES;

const fs = require("fs");

var config = JSON.parse(fs.readFileSync("connectivity_config.json"));

const connection = new Connection(config);

connection.connect((err) => {
  if (err) {
    console.log('Connection Failed');
    throw err;
  }


  let daysAgo = 0;
  let prevDayta:any = await outDatabase(daysAgo);
  for (const day in prevDayta.validMenus) { // all validmenus
      for (const meal in prevDayta.meals[day]) { // all validmeals
          let foods = prevDayta.meals[day][meal];
          if (Object.keys(foods).length > 0) { // {} check
              importFoods(foods);
          }
      }
  }

});

// https://stackoverflow.com/questions/18275386/how-to-automatically-delete-records-in-sql-server-after-a-certain-amount-of-time

function importFoods(foods) {
    for (let i = 0; i < foods.length; i++) {
        let food = foods[i];
        importFood(food);
    }
}

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

  request.on('done', (rowCount, more, rows) => {
    console.log('Done is called!');
  });

  // In SQL Server 2000 you may need: connection.execSqlBatch(request);
  connection.execSql(request);
}

function importFood(food) {
/**
 * [ID] INT NOT NULL,
  [Name] VARCHAR(35) NOT NULL,
  Calories SMALLINT NULL,
  Carbohydrates SMALLINT NULL,
  Protein SMALLINT NULL,
  Fat SMALLINT NULL,
  Tier TINYINT NOT NULL,
  ServingSize INT NULL,
  ServingUnits VARCHAR(35) NULL,
  Nutritionless BINARY(1) NULL,
  Vegetarian BINARY(1) NULL,
  Vegan BINARY(1) NULL,
  GlutenFree BINARY(1) NULL,
  Meal NVARCHAR(10) NOT NULL,
 */
// {"id":"24575459","label":"scrambled eggs","description":"string","short_name":"string","raw_cooked":1010101,"meal":"brunch","tier":0,"nutritionless":false,"artificial_nutrition":false,
// "nutrition":{"kcal":"45","well_being":1010101},"station_id":1010101,"station":"string",
// "nutrition_details":{"calories":{"value":"45","unit":"string"},"servingSize":{"value":"1.1","unit":"oz"},
// "fatContent":{"value":"3","unit":"string"},"carbohydrateContent":{"value":"0","unit":"string"},"proteinContent":{"value":"4","unit":"string"}},"ingredients":["string[]"],"sub_station_id":1010101,"sub_station":"string","sub_station_order":1010101,"monotony":{},
// "vegetarian":true,"vegan":false,"glutenfree":true}

    // Values contain variables idicated by '@' sign
    const sql = `INSERT INTO ${"Food"} VALUES (24575459,'scrambled eggs',45,0,4,3,0,1.1,'oz',0,1,0,0,'brunch')`;
    const request = new Request(sql, (err, rowCount) => {
      if (err) {
        throw err;
      }
  
      console.log('rowCount: ', rowCount);
      console.log('input parameters success!');
    });
  
    // Setting values to the variables. Note: first argument matches name of variable above.
    request.addParameter('uniqueIdVal', types.UniqueIdentifier, 'ba46b824-487b-4e7d-8fb9-703acdf954e5');
    request.addParameter('intVal', types.Int, 435);
    request.addParameter('nVarCharVal', types.NVarChar, 'hello world');
  
    connection.execSql(request);
  }