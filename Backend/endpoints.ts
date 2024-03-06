// TODO
    // Implement dietary preference filtering (vegetarian means we only show vegetarian foods, etc.)
    // See SDLC for more TODOs
    // These are largely resolved, I'd say Tier Zero maximizer plus hybrid LP/MIP has pretty much shored up any issues with the meal generator
        // I could add some modes for requiring vegetables as constraints
            // I should also add some parametrization for inputting leniency values on the double bounds if that ever ends up useful
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
import * as meals from './meal_service';
import type { FoodSquare } from "./constants_and_types";

// TODO, get rid of the usage of outDatabase and inDatabase this as we SQL-ify, won't need to get everything so crudely every time
    // Plus every service will own some sql stuff (replacing all file stuff), that will be more efficient to move around than all the data at once

// Create
router.post('/generate_meal/:vegetarian/:vegan/:glutenfree/:calories/:fratio/:cratio/:pratio/', async function(req:any, res:any) {
    // gung.FoodSquare = class {
    //     constructor(foodo) {
    //         this.food = foodo;
    //         this.required = false;
    //         this.banned = false;
    //         this.quantity = 0;
    //     }
    // }
    let board:any = req.body;
    let vegetarian:string = req.params.vegetarian;
    let vegan:string = req.params.vegan;
    let glutenfree:string = req.params.glutenfree;
    console.log("Gingko: "+parseInt(req.params.calories));
    let calories:number = parseInt(req.params.calories)?parseInt(req.params.calories):750;
    let fratio:number = parseInt(req.params.fratio)?parseInt(req.params.fratio):25;
    let cratio:number = parseInt(req.params.cratio)?parseInt(req.params.cratio):55;
    let pratio:number = parseInt(req.params.pratio)?parseInt(req.params.pratio):20;
    let meal:FoodSquare[] = await meals.generateMeal(board,
        vegetarian==="true",
        vegan==="true",
        glutenfree==="true",
        calories,
        fratio,
        cratio,
        pratio,
        0.1, // +-lenience in macro ratios
        false); // returns an array of the foods
    for (let leniency = 0.1; leniency <= 1.5 && meal.length == 0; leniency += 0.1) {
        // console.log("Cur Lenience: "+leniency);
        meal = await meals.generateMeal(board,
            vegetarian==="true",
            vegan==="true",
            glutenfree==="true",
            calories,
            fratio,
            cratio,
            pratio,
            leniency,
            true);
    }
    // TODO Implement algorithm for trying multiple methods before quitting

    res.send(meal);
});
// Read
router.get('/test/', async function(req:any, res:any) {
    let daysAgo = 0;
    let toWrite = await scraping.outDatabase(daysAgo);
    await scraping.newWriteDayData(daysAgo,toWrite);
    console.log("Darn good one");
    res.send("Backend is up");
});
// RUN BEFORE FUTURE SCRAPING. Checks if the bon site is up/in the same format it was designed for
router.get('/scraping_up/', async function(req:any, res:any) {
    let up:boolean = await scraping.scrapingUp();
    res.send(up?"public scraping is up":"public scraping is down");
});
// Supporting CORS: https://stackoverflow.com/questions/36840396/fetch-gives-an-empty-response-body
// https://stackoverflow.com/questions/18498726/how-do-i-get-the-domain-originating-the-request-in-express-js
// Meal number denotes which specific meal you are retrieving
router.get('/days_and_meals/:daysAgo/', async function(req:any, res:any) {
    let daysAgo:number = req.params.daysAgo;
    if (daysAgo < -1) {
        res.send("Invalid day: "+daysAgo);
        return;
    }
    let toWrite:any = [];
    if (await scraping.inDatabase(daysAgo)) {
        toWrite = await scraping.outDatabase(daysAgo);
        // scraping.newWriteDayData(daysAgo,toWrite);
    } else {
        console.log("Hung up my gloves");
        toWrite = await scraping.getMenusAndMeals(daysAgo);
        await scraping.newWriteDayData(daysAgo,toWrite);
    }
    // If the gpt file exists, merge these together and send it as meals out
    // If it's already been done, then don't either
    if (gen_ai.beenGenerated(daysAgo)) {
        await gen_ai.mergeArtificialData(toWrite,daysAgo);
    }
    res.send(toWrite);
});
// Update
// Overwrite old_bon_site.html. Only call when sure we can process old_site.html
router.put('/update_archive/',async function(req:any,res:any) {
    let wrote = await scraping.writeArchive();
        if(!wrote) {
            res.send("Error writing archive");
        } else {
            res.send("Success writing archive");
        }
});
router.put('/generate_artificial_data/:daysAgo/',async function(req:any,res:any) {
    let daysAgo = req.params.daysAgo;
    // If the file doesn't exist
    if (!(await scraping.inDatabase(daysAgo))) { // Structured like this because I don't want to spend too much time messing with file processing stuff that will get refactored away, and have code that can be reused
        res.send("Can't GPT what doesn't exist");
        return;
    }
    // If it's already been done, then don't either
    if (gen_ai.beenGenerated(daysAgo)) {
        res.send("Can't GPT what already has been");
        return;
    }

    // now it's gpt time
    // get all the nutritionless from chosen file
    let nutritionlesses:any = await gen_ai.getNutritionless(daysAgo);
    // get all nutritions from the nutritionlesses
        // Key considerations
            // Failing loudly
    // returns all of the nutritions by id
        // this way we can iterate through and match up with raw meal easily
    await gen_ai.convertToNutritioned(nutritionlesses);
    let wrote:boolean = gen_ai.writeGenerated(daysAgo,nutritionlesses);
    if (!wrote) {
        res.send("Error writing GPT data");
    } else {
        res.send("GPT data saved successfully!");
    }
});

module.exports = router;