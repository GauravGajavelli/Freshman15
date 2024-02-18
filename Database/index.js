var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var types = require('tedious').TYPES;
const fs = require("fs");
const { DateTime } = require("luxon");

var config = JSON.parse(fs.readFileSync("connectivity_config.json"));
let daysAgo = 0;
let prevDayta = outDatabase(daysAgo);
let numCalls = 0;
for (const day in prevDayta.validMenus) { // all validmenus
    for (const meal in prevDayta.meals[day]) { // all validmeals
        let foods = prevDayta.meals[day][meal];
        if (Object.keys(foods).length > 0) { // {} check
            for (let i = 0; i < foods.length; i++) {
                let food = foods[i];
                if (true) {
                    const connection = new Connection(config);
                    connection.connect((err) => {
                        if (err) {
                            console.log('Connection Failed');
                            throw err;
                        }
                        numCalls++;
                        importFood(food, day, meal, connection,numCalls);
                        // console.log(numCalls+"th call");
                    });

                }
            }
        }
    }
}

function formattedDate (daysAgo) {
    let val = DateTime.now().minus({ days: daysAgo });
    let toRet = val.year+"-"+val.month.toString().padStart(2,'0')+"-"+val.day.toString().padStart(2,'0');
    return toRet;
}

function outDatabase(daysAgo) {
    let filepath = "../Backend/files/";
    let filename = formattedDate(daysAgo)+"_dayinfo";
    return JSON.parse(fs.readFileSync(filepath+filename+".json"));
}
function importFood(food, day, meal, connection, num) {
    // food = '{"id":"5423187","label":"yogurt vanilla low fat","description":"string","short_name":"string","raw_cooked":1010101,"meal":"dinner","tier":2,"nutritionless":false,"artificial_nutrition":false,"nutrition":{"kcal":"60","well_being":1010101},"station_id":1010101,"station":"string","nutrition_details":{"calories":{"value":"60","unit":"string"},"servingSize":{"value":"0.3","unit":"oz"},"fatContent":{"value":"1","unit":"string"},"carbohydrateContent":{"value":"9","unit":"string"},"proteinContent":{"value":"3","unit":"string"}},"ingredients":["string[]"],"sub_station_id":1010101,"sub_station":"string","sub_station_order":1010101,"monotony":{},"vegetarian":true,"vegan":false,"glutenfree":true}';
    // meal="breakfast";
    // console.log("CUHZIN: "+JSON.stringify(food));
    const request = new Request('insertFood', (err, rowCount) => {
      if (err) { 
        // throw err;   
        console.log(food.label+", "+food.tier);
      }
  
    //   console.log('DONE!');
      connection.close();
    });

    food.nutrition_details.calories.value = parseFloat(food.nutrition_details.calories.value)
                                                        ?parseFloat(food.nutrition_details.calories.value):
                                                        "0.5";
    food.nutrition_details.carbohydrateContent.value = parseFloat(food.nutrition_details.carbohydrateContent.value)
                                                        ?parseFloat(food.nutrition_details.carbohydrateContent.value):
                                                        "0.5";
    food.nutrition_details.fatContent.value = parseFloat(food.nutrition_details.fatContent.value)?
                                                        parseFloat(food.nutrition_details.fatContent.value):
                                                        "0.5";
    food.nutrition_details.proteinContent.value = parseFloat(food.nutrition_details.proteinContent.value)?
                                                parseFloat(food.nutrition_details.proteinContent.value):
                                                "0.5";
    request.addParameter('json', types.VarChar, JSON.stringify(food));
    request.addParameter('date', types.Date, new Date(formattedDate(day)));
    request.addParameter('meal', types.VarChar, meal);

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
    console.log(rowCount);
    //   console.log('Done is called!');
    });

    request.on('requestCompleted', (rowCount, more, rows) => {
        // console.log('Request '+num+' completed!');
      });


    // In SQL Server 2000 you may need: connection.execSqlBatch(request);
    connection.callProcedure(request);
    // console.log(JSON.stringify(food));
}

// https://stackoverflow.com/questions/18275386/how-to-automatically-delete-records-in-sql-server-after-a-certain-amount-of-time
    // So the storage scheme will be that EC2 will host the 
// Create a sproc for insertiont o reject duplciates used food id as id get rid of current table