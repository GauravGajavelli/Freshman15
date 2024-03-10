import OpenAI from "openai";
const openai = new OpenAI();
const fs = require("fs");
var types = require('tedious').TYPES;
var ConnectionM = require('tedious').Connection;
var RequestM = require('tedious').Request;

import { formattedDate } from "./scraping_service";
import { connectPromise } from "./scraping_service";
import type { nutritionDetails } from "./constants_and_types";
import type { Food } from "./constants_and_types";

// GenerativeAIService
// return all of the food objects from a given dayinfo that are nutritionless
/** TODO  */ // Refactor to only do this for a single meal
async function getNutritionless(daysAgo:number, foods:Food[]):Promise<any> {
    let toRet:any = {};
    for (let i = 0; i < foods.length; i++) {
        if (foods[i].nutritionless) {
            const id:number = foods[i]["id"]/* count.toString()*/;
            toRet[id] = foods[i];
            // count++;
        }
    }
    return toRet;
}
// GenerativeAIService
// Turns chatgpt json into nutrition_details
async function artificialToNatural(artificial:any):Promise<nutritionDetails> {
    /* GPT 3.5 Turbo Output
{
  "Energy_kcal": "350",
  "Carbohydrates_g": "10",
  "Lipids_g": "15",
  "Proteins_g": "30",
  "Serving_size_oz": "6"
}
     */
    let parsed:any = await JSON.parse(artificial);
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
    return nDetails;
}
// GenerativeAIService
// modifies with nutrition details
async function convertToNutritioned(nutritionlesses:any):Promise<void> {
    // let count:number = 0;
    for (let i in nutritionlesses) {
        // if ( count == 5) {
        //     break;
        // }
        let ns = nutritionlesses[i];
        let newtrition = await getArtificialNutrition(ns["label"]);
        ns["nutrition_details"] = await artificialToNatural(newtrition);
        ns.nutritionless = false;
        ns.artificial_nutrition = true;
        console.log("Converted: "+ns["label"]);
        // count++;
    }
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

      return completion.choices[0].message.content;
}
// Uses this method: https://catcherholms.medium.com/easy-and-optimized-way-for-batch-bulk-update-sql-records-with-different-unique-values-and-columns-81414419d675
    // for bulk update. Put some thought into the options of adding another table for artificial data, using repeated single update, etc.
    // I don't need to worry about scale that much here: even if some place had twice the number of foods per day that rose had
// The key is minimizing the number of queries: I think we can get it all in one update
// If it's too slow, try an approach splitting into a couple requests, analogous to pagniation
    // https://www.mssqltips.com/sqlservertip/5829/update-statement-performance-in-sql-server/
/** TODO */
function updateMeal(daysAgo:number,foods:Food[]) {
    // First test if insert works, then try this out
    /*
    UPDATE orders 
    SET manager_id = (
    CASE id
    WHEN 1 THEN 21
    WHEN 2 THEN 22
    END
    )
    SET courier_id = (
    CASE id
    WHEN 1 THEN 301
    WHEN 2 THEN 302
    END
    )
    WHERE id IN (1,2)
    */
}
function generateUpdateQueryString(foods:Food[]) {
    // Steps
        // SETs
            // All nutrition fields individually
/*
        calories: {
        servingSize: {
        value: 1,
        unit: "oz"
        },
        fatContent: {
        carbohydrateContent: {
        proteinContent: {
      
*/
            // Each one needs to case by id
                // Case [ID]
                    // WHEN {ID} THEN {VALUE}
        // WHERE
            // ArtificialNutrition = 0 AND
            // Nutritionless = 1
            // Gonna be called daily, so the only time this will be 
                // the case is for today's foods
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