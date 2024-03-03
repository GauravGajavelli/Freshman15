import OpenAI from "openai";
const openai = new OpenAI();
const fs = require("fs");

import { outDatabase } from "./scraping_service";
import { formattedDate } from "./scraping_service";
import type { nutritionDetails } from "./constants_and_types";

// GenerativeAIService
// return all of the food objects from a given dayinfo that are nutritionless
async function getNutritionless(daysAgo:number):Promise<any> {
    let toRet:any = {};
    let prevDayta:any = await outDatabase(daysAgo);
    // console.log("prevData entries: "+Object.entries(prevDayta));
    // console.log("prevData.validMenus entries: "+Object.entries(prevDayta.validMenus));
    // let count:number = 0;
    for (const day in prevDayta.validMenus) { // all validmenus
        // if (prevDayta.validMenus[day]) {
        for (const meal in prevDayta.meals[day]) { // all validmeals
        // if (prevDayta.validMeals[day][meals]) {
            let foods = prevDayta.meals[day][meal];
            if (Object.keys(foods).length > 0) { // {} check
                for (let i = 0; i < foods.length; i++) {
                    if (foods[i].nutritionless) {
                        const id:string = foods[i]["id"]/* count.toString()*/;
                        toRet[id] = foods[i];
                        // count++;
                    }
                }
            }
        // }
        }
        // }
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
// GenerativeAIService
// Returns the merged meal and artificial data
async function mergeArtificialData(toWrite:any,daysAgo:number):Promise<any> {
    // read in gpt data
    let filepath = "files/";
    let filename = formattedDate(daysAgo)+"_gpt_nutrition";
    let gptData:any = await JSON.parse(await fs.promises.readFile(filepath+filename+".json"));
    // iterate through all of the days/meals/foods, and replace the foods with artificials based on matches in keyset
    for (const day in toWrite.validMenus) { // all validmenus
        for (const meal in toWrite.meals[day]) { // all validmeals
            let foods = toWrite.meals[day][meal];
            if (Object.keys(foods).length > 0) { // {} check
                for (let i = 0; i < foods.length; i++) {
                    if (foods[i].nutritionless) {
                        foods[i] = gptData[foods[i].id];
                    }
                }
            }
        }
    }
}
function beenGenerated(daysAgo:number) {
    let filepath = "files/";
    return fs.existsSync(filepath+formattedDate(daysAgo)+"_gpt_nutrition.json");
}
function writeGenerated(daysAgo:number,generated:any):boolean {
    // Save in a file
    let filepath = "files/";
    fs.writeFile(filepath+formattedDate(daysAgo)+"_gpt_nutrition.json", JSON.stringify(generated), function(err:any, buf:any ) {
        if(err) {
            return false;
        } else {
            return true;
        }
    });
    return false;
}

export {getNutritionless,convertToNutritioned,mergeArtificialData,beenGenerated,writeGenerated};