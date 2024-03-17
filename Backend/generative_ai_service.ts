import OpenAI from "openai";
const openai = new OpenAI();
const fs = require("fs");
var types = require('tedious').TYPES;
var ConnectionM = require('tedious').Connection;
var RequestM = require('tedious').Request;

import { getNewConnection } from "./scraping_service";
import { getRestaurantMealID } from "./scraping_service";
import { execSqlRequestDonePromise } from "./scraping_service";
import { booleanToBit } from "./scraping_service";
import { RestaurantMealsLoadStatus, foodTier, type nutritionDetails } from "./constants_and_types";
import type { Food } from "./constants_and_types";

// GenerativeAIService
// return all of the food objects from a given dayinfo that are nutritionless
function getNutritionless(daysAgo:number, foods:Food[]):Food[] {
    let toRet:Food[] = [];
    for (let i = 0; i < foods.length; i++) {
        if (foods[i].nutritionless /**&& foods[i].tier == foodTier.Special*/) {
            toRet.push(foods[i]);
        }
    }
    return toRet;
}
// GenerativeAIService
// Turns chatgpt json into nutrition_details
function artificialToNatural(artificial:any):nutritionDetails {
    /* GPT 3.5 Turbo Output
{
  "Energy_kcal": "350",
  "Carbohydrates_g": "10",
  "Lipids_g": "15",
  "Proteins_g": "30",
  "Serving_size_oz": "6"
}
     */
    let parsed:any = JSON.parse(artificial);
    let keys:string[] = Object.keys(parsed); // the ordering is fixed (per observation), even if the names change
    // console.log(artificial);
    // console.log("Calories?: "+artificial[keys[0]]);
    let numOz:number = parseInt(parsed[keys[4]]); // normalizing to 1 oz to make it easier for them to fit into a meal
    const nDetails: nutritionDetails = {
        calories: {
        value: parseInt(parsed[keys[0]])/numOz,
        unit: "string"
        },
        servingSize: {
        value: 1,
        unit: "oz"
        },
        fatContent: {
        value: parseInt(parsed[keys[2]])/numOz,
        unit: "string"
        },
        carbohydrateContent: {
        value: parseInt(parsed[keys[1]])/numOz,
        unit: "string"
        },
        proteinContent: {
        value: parseInt(parsed[keys[3]])/numOz,
        unit: "string"
        }
    };
    if (Object.is(NaN, nDetails.calories.value)) {
        nDetails.calories.value = 0;
    }
    if (Object.is(NaN, nDetails.fatContent.value)) {
        nDetails.fatContent.value = 0;
    }
    if (Object.is(NaN, nDetails.carbohydrateContent.value)) {
        nDetails.carbohydrateContent.value = 0;
    }
    if (Object.is(NaN, nDetails.proteinContent.value)) {
        nDetails.proteinContent.value = 0;
    }
    return nDetails;
}
// GenerativeAIService
// modifies with nutrition details
async function convertToNutritioned(nutritionlesses:any):Promise<any> {
    // let count:number = 0;
    let promArr:Promise<any>[]=[];
    let promArr2:Promise<any>[]=[];
    
    for (let i in nutritionlesses) {
        // if ( count == 5) {
        //     break;
        // }
        let ns = nutritionlesses[i];
        let newtrition = getArtificialNutrition(ns["label"]);
        let toAdd = newtrition.then((completion) => {
            let newtrition = completion.choices[0].message.content;
            ns["nutrition_details"] = artificialToNatural(newtrition);
            ns.nutritionless = false;
            ns.artificial_nutrition = true;
            console.log("Converted: "+ns["label"]);
        });
        promArr.push(newtrition);
        promArr2.push(toAdd);
    }
    await Promise.all(promArr);
    return Promise.all(promArr2);
}
// GenerativeAIService
async function getArtificialNutrition(name:string):Promise<any> {
    const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: `As a dietitian, please draw a table to calculate line by line the energy (kcal)/carbohydrates (g)/lipids (g)/proteins (g) of the food items (raw, not cooked) used as ingredients in an "${name}" served for lunch in a cafeteria managed by Bon Appétit Management Company. In lieu of precise numbers, estimate the exact quantities of each ingredient and the effects of cooking processes to determine the energy (kcal)/carbohydrates (g)/lipids (g)/proteins (g) in a serving of ${name}, as well as how many ounces would be in that serving size.

        Keep your response brief, only providing the final numerical result of the analysis in a json file with the totals of energy (kcal)/carbohydrates (g)/lipids (g)/proteins (g) as well as the serving size.`}],
        // model: "gpt-4-1106-preview",
        model: "gpt-3.5-turbo-1106",
        response_format: { type: "json_object" },
      });

      return completion;
}
// Uses this method: https://catcherholms.medium.com/easy-and-optimized-way-for-batch-bulk-update-sql-records-with-different-unique-values-and-columns-81414419d675
    // for bulk update. Put some thought into the options of adding another table for artificial data, using repeated single update, etc.
    // I don't need to worry about scale that much here: even if some place had twice the number of foods per day that rose had
// The key is minimizing the number of queries: I think we can get it all in one update
// If it's too slow, try an approach splitting into a couple requests, analogous to pagniation
    // https://www.mssqltips.com/sqlservertip/5829/update-statement-performance-in-sql-server/

async function updateMeal(foods:Food[],daysAgo:number,mealstr:string):Promise<boolean> {
    const connection = await getNewConnection(false,true);
    let request = getRestaurantMealID(daysAgo,mealstr, connection);
    request.on('error', function (err:any) {
        throw err;
    });
    let rows1:any = await execSqlRequestDonePromise(request);
    let restaurantmealid:number = rows1[0][0].value; // first (and only) row, first (and only) column
    
    console.log("kadokana: "+restaurantmealid);
    
    const connection2 = await getNewConnection(false,false);
    let request2 = updateMealFromTable(foods, restaurantmealid, connection2);
    await execSqlRequestDonePromise (request2);
    request2.on('error', async function (err:any) {
        const connection3 = await getNewConnection(false,false);
        let request3 = updateMealStatusFromTable(restaurantmealid,RestaurantMealsLoadStatus.FailedGenerated, connection3);
        await execSqlRequestDonePromise (request3);
        request3.on('error', function (err:any) {
            throw err;
        });
        throw err;
    });

    const connection3 = await getNewConnection(false,false);
    let request3 = updateMealStatusFromTable(restaurantmealid,RestaurantMealsLoadStatus.Generated, connection3);
    await execSqlRequestDonePromise (request3);
    request3.on('error', function (err:any) {
        throw err;
    });
    return true;
}

function updateMealStatusFromTable (restaurantmealid:number,status:RestaurantMealsLoadStatus,connection:any):any {
    let sql = "UPDATE RestaurantMealLoadStatus SET [STATUS]=@status WHERE RestaurantMealLoadStatusID=@restaurantmealid";
    let request = new RequestM(sql, function (err:any, rowCount:any, rows:any) {
        if (err) {
            throw err;
        }
    });

    request.addParameter('status', types.VarChar, RestaurantMealsLoadStatus[status]);
    request.addParameter('restaurantmealid', types.Int, restaurantmealid);

    connection.execSql(request);
    return request;
}

function updateMealFromTable (foods:Food[],restaurantmealid:number,connection:any):any {
    let sql = generateUpdateQueryString(foods,restaurantmealid);
    console.log(sql);
    let request = new RequestM(sql, function (err:any, rowCount:any, rows:any) {
        if (err) {
            throw err;
        }
    });

    connection.execSql(request);
    return request;
}

// https://dba.stackexchange.com/questions/232887/where-in-query-to-very-large-table-is-slow
    // Concatenated indices can speed this up if it ends up too slow
        // First convert the IN to this form though
function generateUpdateQueryString(foods:Food[],restaurantmealid:number) {
    let toRet:string = ""; // apparently js uses ropes; building strings like this ain't too bad
    let queryObject:any = {
        'Calories':"",
        'Carbohydrates':"",
        'Protein':"",
        'Fat':"",
        'ServingSize':"",
        'ServingUnits':"",
        'ArtificialNutrition':"",
        'Nutritionless':""
    };
    let keys = Object.keys(queryObject);
    for (let key in keys) {
        queryObject[keys[key]] += `UPDATE Food\nSET ${keys[key]} = \n`;
        queryObject[keys[key]] += `CASE \n`;
    }
    for (let i:number = 0; i < foods.length; i++) {
        // Updates by reference as long as you don't reassign argument: https://stackoverflow.com/questions/518000/is-javascript-a-pass-by-reference-or-pass-by-value-language
        let food = foods[i];
        updateQueryObject(queryObject,food);
    }
    for (let key in keys) {
        toRet += queryObject[keys[key]];
        toRet += `END\nWHERE RestaurantMealID = ${restaurantmealid} AND Nutritionless = 1\n`;
    }
    return toRet;
    // Steps
        // SETs
            // All nutrition fields individually
            // Each one needs to case by id
                // Case [ID]
                    // WHEN {ID} THEN {VALUE}
        // WHERE
            // ArtificialNutrition = 0 AND
            // Nutritionless = 1
            // Gonna be called daily, so the only time this will be 
                // the case is for today's foods
            // RestaurantMealID = restaurantmealid
                // This is better; allows this to be reused for other updates
}
function updateQueryObject(queryObject:any,food:Food):void {
    let keys = Object.keys(queryObject);
    for (let key in keys) {
        queryObject[keys[key]] += `WHEN [id] = ${food.id} THEN ${getSchemaProperty(food,keys[key])}\n`;
    }
}
function getSchemaProperty(food:Food,colName:string):any {
    switch (colName) {
        case 'Calories':
            return food.nutrition_details.calories.value;
        case 'Carbohydrates':
            return food.nutrition_details.carbohydrateContent.value;
        case 'Protein':
            return food.nutrition_details.proteinContent.value;
        case 'Fat':
            return food.nutrition_details.fatContent.value;
        case 'ServingSize':
            return food.nutrition_details.servingSize.value;
        case 'ServingUnits':
            return '\''+food.nutrition_details.servingSize.unit+'\'';
        case 'Nutritionless':
            return booleanToBit(food.nutritionless);
        case 'ArtificialNutrition':
            return booleanToBit(food.artificial_nutrition);
        default:
          console.log(`This column name has nothing to do with artificial nutrition update: ${colName}`);
    }
}
// No longer need to check if the food has been gpt'd it already will be if it's been gotten
// Write to the Food Table (add ArtificialNutrition and NullNutrition booleans to Food, make nutrition fields nullable and enter this data into them)
/**
 * Nulls should be put in the nutrition of foods missing nutrition or which need to be generated

Generation happens all at the same time; whenever someone says they want nutrition generated for a food, they are implicitly doing it for all, triggering the loading screen

In the user interface, all of the foods that haven’t any nutrition aren’t included in calculations and are at the bottom all separately grouped together and grayed out
- So user's aren't greeted with a loading screen
  - Make it such that it's possible to have no meal selected (always need a restaurant and day though) - this is the new initial state
  - Then when you click into a meal it will start loading

Approach to crash handling in the process: 
- Current: There's only like 2 requests. It won't crash lol
- Future: If there is a crash while initially getting, I'll allow a user to request a reload of the data
  - Will wipe everything and try again
  - Otherwise, if they get corrupted or incomplete data, they're stuck with it
 * 
 */

export {getNutritionless,convertToNutritioned,updateMeal};

// https://use-the-index-luke.com/sql/where-clause#:~:text=Although%20the%20where%20clause%20has,ingredient%20of%20a%20slow%20query.
    // How to use indices for speed; but is it even worth using an index on the boolean statement Nutritionless
/*
53% of consumers will click away from a page that takes more than 3 seconds to load
Consider using Pagination (https://nordicapis.com/everything-you-need-to-know-about-api-pagination/) and optimize the api response package (https://nordicapis.com/optimizing-the-api-response-package/)
Now I want to know where I could’ve learned this information beforehand and how I could find more stuff like it for the future
https://stackoverflow.com/questions/850117/whats-the-most-efficient-way-to-insert-thousands-of-records-into-a-table-mysql
Like N+1, the moral of the story is that many individual inserts is not the way to go, esp for the network (this also solves the consistency of connectivity issue)
https://stackoverflow.com/questions/2766039/fastest-way-for-inserting-very-large-number-of-records-into-a-table-in-sql
More specifically T-SQL; also look into any more modern solution
It’ll only take like 3 connections, thankfully
“If you can do a hand-rolled INSERT statement, then that's the way I'd go. A single INSERT statement with multiple value clauses is much much faster than lots of individual INSERT statements.”
Avoid lazy loading
“Lazy loading is great for long web pages with lots of heavyweight content (like images, gifs, and videos) that are non-essential to the user experience on first load.”
Not at all my site; my data is needed immediately
If I can’t get it below 3 seconds, I could take psychological approaches to distracting from this
    One idea is splitting the loading screens; so like one then a break that seems to end it and then another one (only works for two tho)
    https://www.google.com/search?q=using+psychology+to+distrcat+from+loading+times&rlz=1C1CHBD_en-GBUS1099US1099&oq=using+psychology+to+distrcat+from+loading+times&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIJCAEQIRgKGKABMgkIAhAhGAoYoAEyCQgDECEYChigAdIBCDU1MzdqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8
    https://medium.com/@WebdesignerDepot/4-tricks-to-make-load-times-feel-faster-788d2fee586b
    https://ux.stackexchange.com/questions/35734/if-you-cant-improve-loading-time-is-distracting-the-user-a-good-technique
    https://www.wired.com/2016/08/science-waiting-waiting-page-load/


https://blog.hubspot.com/website/lazy-loading-eager-loading
“Lazy loading hides an n+1 problem behind a single call. The caller has no reasonable way to discern what is occurring within the API and therefore no way to avoid these costly requests. As usage of the API increases the performance of API requests that implement lazy loading will become more of a burden on the system.”

*/