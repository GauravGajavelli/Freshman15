import OpenAI from "openai";
const openai = new OpenAI();
const fs = require("fs");

import { outDatabase } from "./scraping_service";
import { formattedDate } from "./scraping_service";
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
- Current: Who cares I'll do it later
- Future: If there is a crash while initially getting, I'll allow a user to request a reload of the data
  - Will wipe everything and try again
  - Otherwise, if they get corrupted or incomplete data, they're stuck with it

 * 
 */

/** TODO */

export {getNutritionless,convertToNutritioned};