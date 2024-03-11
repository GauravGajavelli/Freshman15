// TODO
    // Tier Zero for appeal, LP for accuracy, and MIP as a safety net
    // - Lel maybe I can just literally seed the alg for new random results every time (like giving certain foods a normally distributed weight value centered at 10 [or whatever the means of the current fat, carb, and protein sums in grams are] and distributed the same way)
        // Another seed to try first: - As I added on a second and third macronutrient to the constraint equations, it became clear that I needed to widen the lower and upper bounds (from working at 0.9 and 1.1 at first to 0.5 and 1.5 to 0.1 and 1.9, potentially pushing to 0 and >2.0 in the future idk)
        // - Figure out the mean and sd of current and previously valid seeds to reverse engineer (so all macro 'vars' arrays individually, pairwise, and all three)

console.log("Hello Bon");

var express = require('express');
var router = express.Router();
const fs = require("fs");

var Connection = require('tedious').Connection;
var Request = require('tedious').Request;

// ScrapingService
import * as scraping from './scraping_service';
// UserService
import * as users from './user_service';
// GenerativeAIService
import * as gen_ai from './generative_ai_service';
// MealService (calculating, crudding foods, etc)
// import * as meals from './meal_service';
import type { FoodSquare } from "./constants_and_types";
import type { Food } from './constants_and_types';
import { RestaurantMealsLoadStatus } from "./constants_and_types";

// TODO, get rid of the usage of outDatabase and inDatabase this as we SQL-ify, won't need to get everything so crudely every time
    // Plus every service will own some sql stuff (replacing all file stuff), that will be more efficient to move around than all the data at once

// #region Create
// router.post('/generate_meal/:vegetarian/:vegan/:glutenfree/:calories/:fratio/:cratio/:pratio/', async function(req:any, res:any) {
//     // gung.FoodSquare = class {
//     //     constructor(foodo) {
//     //         this.food = foodo;
//     //         this.required = false;
//     //         this.banned = false;
//     //         this.quantity = 0;
//     //     }
//     // }
//     let board:any = req.body;
//     let vegetarian:string = req.params.vegetarian;
//     let vegan:string = req.params.vegan;
//     let glutenfree:string = req.params.glutenfree;
//     console.log("Gingko: "+parseInt(req.params.calories));
//     let calories:number = parseInt(req.params.calories)?parseInt(req.params.calories):750;
//     let fratio:number = parseInt(req.params.fratio)?parseInt(req.params.fratio):25;
//     let cratio:number = parseInt(req.params.cratio)?parseInt(req.params.cratio):55;
//     let pratio:number = parseInt(req.params.pratio)?parseInt(req.params.pratio):20;
//     let meal:FoodSquare[] = await meals.generateMeal(board,
//         vegetarian==="true",
//         vegan==="true",
//         glutenfree==="true",
//         calories,
//         fratio,
//         cratio,
//         pratio,
//         0.1, // +-lenience in macro ratios
//         false); // returns an array of the foods
//     for (let leniency = 0.1; leniency <= 1.5 && meal.length == 0; leniency += 0.1) {
//         // console.log("Cur Lenience: "+leniency);
//         meal = await meals.generateMeal(board,
//             vegetarian==="true",
//             vegan==="true",
//             glutenfree==="true",
//             calories,
//             fratio,
//             cratio,
//             pratio,
//             leniency,
//             true);
//     }
//     // TODO Implement algorithm for trying multiple methods before quitting

//     res.send(meal);
// });
// #endregion

// #region Read
router.get('/test/', async function(req:any, res:any) {
    let daysAgo = 0;
    res.send("Backend is up");
});
// RUN BEFORE FUTURE SCRAPING. Checks if the bon site is up/in the same format it was designed for
router.get('/scraping_up/', async function(req:any, res:any) {
    let up:boolean = await scraping.scrapingUp();
    res.send(up?"public scraping is up":"public scraping is down");
});
// Returns strings of valid meals for the given restaurant
router.get('/mealnames/:daysAgo/', async function(req:any, res:any) { // Will add restaurant
    let daysAgo:number = req.params.daysAgo;
    if (daysAgo < -1) {
        res.send("Invalid day: "+daysAgo);
        return;
    }
    let mealnames:string[] = [];
    try {
        if (await scraping.hasMealNames(daysAgo)) {
            mealnames = await scraping.readMealNames(daysAgo);
        } else {
            mealnames = await scraping.getMealNames(daysAgo);
            await scraping.writeMealNames(daysAgo,mealnames);
        }
        res.send(mealnames);
    } catch (error) {
        res.status(500).send('500 Internal Server Error');
    };
});

router.get('/meal/:daysAgo/:mealstr', async function(req:any, res:any) { // Will add restaurant
    let daysAgo:number = req.params.daysAgo;
    if (daysAgo < -1) {
        res.send("Invalid day: "+daysAgo);
        return;
    }
    let mealstr:string = req.params.mealstr;
    if (mealstr == "") {
        res.send("Empty meal string: "+mealstr);
        return;
    }
    let toWrite:Food[] = [];
    let writeSuccess:boolean = true;
    try {
        if (await scraping.hasMeal(daysAgo,mealstr)) {
            toWrite = await scraping.readMeal(daysAgo,mealstr);
        } else {
            toWrite = await scraping.getMeal(daysAgo,mealstr);
            writeSuccess = await scraping.writeMeal(daysAgo,mealstr,toWrite);
        }
        if (writeSuccess) {
            res.send(toWrite);
        } else {
            res.send("Failed to write meal!");
        }
    } catch (error) {
        res.status(500).send('500 Internal Server Error');
    };
});
// Will get the state of the meal giving the FSM of the frontend loading the info it needs
    // check has meal, otherwise put unscraped
    // Get the meal status otherwise
router.get('/meal_status/:daysAgo/:mealstr', async function(req:any, res:any) { // Will add restaurant
    let daysAgo:number = req.params.daysAgo;
    if (daysAgo < -1) {
        res.send("Invalid day: "+daysAgo);
        return;
    }
    let mealstr:string = req.params.mealstr;
    if (mealstr == "") {
        res.send("Empty meal string: "+mealstr);
        return;
    }
    try {
        // query RestaurantMealStatus tables for this data
        if (await scraping.hasMeal(daysAgo,mealstr)) {
            res.send(await scraping.readMealStatus(daysAgo,mealstr));
        } else {
            res.send(RestaurantMealsLoadStatus[RestaurantMealsLoadStatus.Unscraped]);
        }
    } catch (error) {
        res.status(500).send('500 Internal Server Error');
    };
});
// #endregion

// #region Update
// Overwrite old_bon_site.html. Only call when sure we can process old_site.html
router.put('/update_archive/',async function(req:any,res:any) {
    let wrote = await scraping.writeArchive();
        if(!wrote) {
            res.send("Error writing archive");
        } else {
            res.send("Success writing archive");
        }
});
// Will be called after foods have been scraped
router.put('/generate_artificial_data/:daysAgo/:mealstr',async function(req:any,res:any) {
    let daysAgo:number = req.params.daysAgo;
    if (daysAgo < -1) {
        res.send("Invalid day: "+daysAgo);
        return;
    }
    let mealstr:string = req.params.mealstr;
    if (mealstr == "") {
        res.send("Empty meal string: "+mealstr);
        return;
    }
    try {
        if (await scraping.hasMeal(daysAgo,mealstr)) {
            if (await scraping.readMealStatus(daysAgo,mealstr) != RestaurantMealsLoadStatus[RestaurantMealsLoadStatus.Generated]) {
                let foods:Food[] = await scraping.readMeal(daysAgo,mealstr);
                let nutritionlesses:Food[] = gen_ai.getNutritionless(daysAgo,foods);
                await gen_ai.convertToNutritioned(nutritionlesses);
                let success = await gen_ai.updateMeal(nutritionlesses,daysAgo,mealstr);
                if (success) {
                    res.send(nutritionlesses);
                } else {
                    res.send("Failed to generate artificial nutrition");
                }
            } else {
                res.send("Nutrition has already been generated");
            }
        } else {
            res.send("Don't have the meal yet");
        }
    } catch (error) {
        res.status(500).send('500 Internal Server Error');
    };
});
// #endregion

module.exports = router;