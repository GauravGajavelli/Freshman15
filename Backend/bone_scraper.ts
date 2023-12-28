// TODO
    // - Lel maybe I can just literally seed the alg for new random results every time (like giving certain foods a normally distributed weight value centered at 10 [or whatever the means of the current fat, carb, and protein sums in grams are] and distributed the same way)
        // Another seed to try first: - As I added on a second and third macronutrient to the constraint equations, it became clear that I needed to widen the lower and upper bounds (from working at 0.9 and 1.1 at first to 0.5 and 1.5 to 0.1 and 1.9, potentially pushing to 0 and >2.0 in the future idk)
        // - Figure out the mean and sd of current and previously valid seeds to reverse engineer (so all macro 'vars' arrays individually, pairwise, and all three)
    // - Make it run like 10x tries for a good result (measured by the matches system of previous email or something like a MAE or MSE threshold over all macronutrient percentages) - I could array all the solutions and do an in place sort with a comparator like a head, like so: https://stackoverflow.com/questions/17420773/how-to-make-a-efficient-comparator-for-javascript-sort-function-for-sorting-an-a
        // - Previous email: A way to mitigate this disobedient nature is to categorize solutions into 3*2 = six possibilities for what macronutrient is highest and what's the lowest and try the various methods repeatedly until we get as close a match (rank the results by similarity to the desired quantity in three tiers: 2 being both highest and lowest macro match what the highest/lowest were in the request, 1 being either matches, and 0 being neither do) - Then just return that lel
        // Do this from inside meal gen function, then call the sort on solutions that made it through, and send the best one back if possible

console.log("Hello Bon");

var express = require('express');
var router = express.Router();
const fs = require("fs");
const { DateTime } = require("luxon");
const GLPK = require('glpk.js');
const glpk = GLPK();

var puppeteer = require('puppeteer');

// https://legacy.cafebonappetit.com/print-menu/cafe/1374/menu/463779/days/today/pgbrks/1/
// This gives an easily parsible overview of the key foods of the day
// document.querySelectorAll(".meal-types .item")

// url = "https://rose-hulman.cafebonappetit.com/"
// This gives a more specific breakdown of the nutrition of each item for the day (json with all foods): 
// scripts = soup.find_all("script", string=re.compile(r"Bamco\.dayparts"))
// menuitems = soup.find_all(
//     "script", string=re.compile(r"Bamco\.menu_items"))
const archivedBonSite = "files/old_bon_site.html";
enum foodTier {
    Special = 0,
    Additional,
    Condiment
}
enum meals {
    Breakfast = 0,
    Lunch,
    Dinner 
}
type Food = {    
    "id": number,
    "label": string,
    "description": string,
    "short_name": string,
    "raw_cooked": number,
    "meal":meals,
    "tier":foodTier,
    "nutritionless":boolean,
    "nutrition": {
        "kcal": number,
        "well_being": number,
    },
    "station_id": number,
    "station": string,
    "nutrition_details": {
        "calories": {
        "value": number,
        "unit": string
        },
        "servingSize": {
        "value": number,
        "unit": string
        },
        "fatContent": {
        "value": number,
        "unit": string
        },
        "carbohydrateContent": {
        "value": number,
        "unit": string
        },
        "proteinContent": {
        "value": number,
        "unit": string
        }
    },
    "ingredients": string[],
    "sub_station_id": number,
    "sub_station": string,
    "sub_station_order": number,
    "monotony": {}
}
// Returns specific sections of courses
function food_factory (id: number, name: string, calories:number, carbs: number, rote: number, phat: number, melie:meals,tear:foodTier, servingSize:number,servingUnits:string,nutritionl:boolean):Food {
    const toRet: Food = {
        id: id,
        label: name,
        description: "string",
        short_name: "string",
        raw_cooked: 1010101,
        meal:melie,
        tier:tear,
        nutritionless:nutritionl,
        nutrition: {
            kcal: calories,
            well_being: 1010101,
        },
        station_id: 1010101,
        station: "string",
        nutrition_details: {
            calories: {
            value: calories,
            unit: "string"
            },
            servingSize: {
            value: servingSize,
            unit: servingUnits
            },
            fatContent: {
            value: phat,
            unit: "string"
            },
            carbohydrateContent: {
            value: carbs,
            unit: "string"
            },
            proteinContent: {
            value: rote,
            unit: "string"
            }
        },
        ingredients: ["string[]"],
        sub_station_id: 1010101,
        sub_station: "string",
        sub_station_order: 1010101,
        monotony: {}
    }
    return toRet;
}
// Valid numbers of days ago: -1 < n <= whatever
function bonSite(daysAgo:number):string {
    return 'https://rose-hulman.cafebonappetit.com/cafe/'+(daysAgo!=0?formattedDate(daysAgo):'');
}
function formattedDate (daysAgo:number):string {
    let val = DateTime.now().minus({ days: daysAgo });
    return val.year+"-"+val.month.toString().padStart(2,'0')+"-"+val.day.toString().padStart(2,'0');
}
function getStandardDeviation (array:any[]):number {
    const n:number = array.length;
    const mean:number = average(array);
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a:number, b:number) => a + b) / n);
}
function average(arr:any[]):number {
    return arr.reduce( ( p:number, c:number ) => p + c, 0 ) / arr.length;
};
function gaussianRandom(mean:number, stdev:number):number {
    const u:number = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v:number = Math.random();
    const z:number = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}
function research(board:any,v:boolean,ve:boolean,gf:boolean,k:number,f:number,c:number,p:number):any {
    let toRet:any = [];
    let i:number = 0;
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["proteinContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet.push((cal*4));

            cal = parseInt(fS.food["nutrition_details"]["carbohydrateContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet[i] += ((cal*4));

            cal = parseInt(fS.food["nutrition_details"]["fatContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet[i] += ((cal*9));
            i++;
        }
    }

    let farr:any = toRet;
    let retAvg:number = average(farr);
    let retSd:number = getStandardDeviation(farr);
    console.log("fAvg: "+retAvg);
    console.log("fSd: "+retSd);

    // console.log("halleluAvg: "+average(vals));
    // console.log("jahSd: "+getStandardDeviation(vals));

    toRet = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["fatContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet.push({ name: id, coef: gaussianRandom(retAvg,retSd)});
        }
    }
    return toRet;
    
    // let filepath = "files/";
    // let filename = "food_totals";
    // let dir_exists = fs.existsSync(filepath);
    // if (!dir_exists) { // If the directory already exists
    //     fs.promises.mkdir(filepath,{ recursive: true });
    // }
    // fs.writeFile(filepath+filename+".json", JSON.stringify({farr}), function(err:any, buf:any ) {
    //     if(err) {
    //         console.log("error: ", err);
    //     } else {
    //         console.log("Food arr saved successfully!");
    //     }
    // });
}
// TODO for future refactor: Will need to know all of the variable names
function createObjective(board:any,v:boolean,ve:boolean,gf:boolean,k:number,f:number,c:number,p:number):any {
    // Objective (could be any of the following)
        // Simple
            // Stigler diet: buffet case (same as stigler, but everything costs zero)
            // Maximize the variety of the foods; potentially represented by a metric summing the residuals from the mean for each macronutrient in their ratio
                // A chat driven version of this for crunch might work out
        // Heuristic/Chat Driven
            // Stigler diet: small plates case (same as stigler, but we use some approximate metric of number of plates or plate size to minimize by)
            // How about just minimizing the number of different foods appearing, in order to make it easy to gather them
                // Like with boolean variables
            // I could try optimizing by having the foods chosen be from the fewest number of stations possible
                // Objective could be then minimizing the sets of boolean variables representing different stations
            // Chat-GPT generated parameters for every food, eg crunchiness or sweet/salt to make it more palatable than the apparently ridiculed stigler diet
    // Going with the simplest objective: 
        // Well the cost of all of the items would've been their frequencies added up since they were all normalized to quantities that had the same price
        // Since our normalized price is free, I'd say our objective would simply be to maximize z = 0*f1+0*f2+0*f3+... = 0
            // f1, f2, ... denote the food names, but I'll just use food ids or names to keep it simpler
        let objective:any = [];
        for (const id in board) {
            const fS = board[id];
            // if (fS.food["tier"] == 2) {
                objective.push({ name : id, coef: Math.random() });
            // }
        }
        // TEST CODE BELOW
        objective = getCalVars(board); // works
        // objective = getProteinVars(p,true,board).concat(getCarbVars(c,true,board)).concat(getFatVars(f,true,board)); // works
        // objective = research(board,v,ve,gf,k,f,c,p); // works
        // objective = getProteinVars(p,true,board);
        // objective = [{name:"actuallyzero",coef: 1.0}];
        // console.log("Objetivo: "+objective);
        // objective.push({ name : "f5423187", coef: 1.0 });
        // objective.push({ name : "f5423174", coef: 1.0 });
        // objective.push({ name : "f5423169", coef: 1.0 });


        return {
        direction: glpk.GLP_MAX,
        name: 'Stigler Diet: Max Calories',
        vars: objective
    };
}
// TODO Null check won't matter, so I should 
// Returns array of foods with corresponding calories
function getCalVars(board:any):any {
    // vars: [
    //     { name: 'x1', coef: 0.6 },
    //     { name: 'x2', coef: 0.5 }
    // ]
    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
    // if (id == "f5423187" || id == "f5423174" || id == "f5423169") {
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["calories"]["value"]);
            if (!cal) {
                cal = (10*9)+(10*4)+(10*4);
            }
            toRet.push({ name: id, coef: cal });
        }
    // }
    }
    return toRet;
}
// Returns array of foods with corresponding fat
//
// constraint one: f must be prop to c
// (total calories from fat/f%)
function getFatVars(f:number,positive:boolean,board:any):any { // assumes all values in foods are in grams
    // vars: [
    //     { name: 'x1', coef: 0.6 },
    //     { name: 'x2', coef: 0.5 }
    // ]
    /*let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["fatContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet.push({ name: id, coef: cal });
        }
    }
    return toRet;*/

    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["fatContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet.push({ name: id, coef: (positive?1:-1)*(cal*9)/*/(f/100)*/});
        }
    }
    return toRet;
}
// Returns array of foods with corresponding carbohydrates
// 
// constraint two: f must be prop to p
// (total calories from carb/c%) = 0
function getCarbVars(c:number,positive:boolean,board:any):any { // assumes all values in foods are in grams
    // vars: [
    //     { name: 'x1', coef: 0.6 },
    //     { name: 'x2', coef: 0.5 }
    // ]
    /*let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["carbohydrateContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet.push({ name: id, coef: cal });
        }
    }
    return toRet;*/

    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["carbohydrateContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet.push({ name: id, coef: (positive?1:-1)*(cal*4)/*/(c/100)*/});
        }
    }
    return toRet;
}
// Returns array of foods with corresponding fat
// 
// constraint three: p must be prop to c
// (total calories from protein/p%)
function getProteinVars(p:number,positive:boolean,board:any):any { // assumes all values in foods are in grams
    // vars: [
    //     { name: 'x1', coef: 0.6 },
    //     { name: 'x2', coef: 0.5 }
    // ]
    /*let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["proteinContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet.push({ name: id, coef: cal });
        }
    }
    return toRet;*/

    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["proteinContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet.push({ name: id, coef: (positive?1:-1)*(cal*4)/*/(p/100)*/});
        }
    }
    return toRet;
}
// TODO Add in dietary restrictions into calculation
function calculateRequiredsBanneds(board:any,v:boolean,ve:boolean,gf:boolean):any { // creates a bunch of single variable constraints for required/banned foods, dietary restrictions
    // subjectTo: [
    //     {
    //     name: 'cons1',
    //         vars: [
    //             { name: 'x1', coef: 1.0 },
    //             { name: 'x2', coef: 2.0 }
    //         ],
    //         bnds: { type: glpk.GLP_UP, ub: 1.0, lb: 0.0 }
    //     },
    //     {
    //         name: 'cons2',
    //         vars: [
    //             { name: 'x1', coef: 3.0 },
    //             { name: 'x2', coef: 1.0 }
    //         ],
    //         bnds: { type: glpk.GLP_UP, ub: 2.0, lb: 0.0 }
    //     }
    // ]

    // gung.FoodSquare = class {
    //     constructor(foodo) {
    //         this.food = foodo;
    //         this.required = false;
    //         this.banned = false;
    //         this.quantity = 0;
    //     }
    // }
    let toRet:any = [];
    for (const id in board) {
        // console.log("A Priori: "+(typeof board[property].required));
        const fS = board[id]; // foodSquare
        if (fS.banned || fS.food["tier"] == 1 /* add in dietary restrictions */) { // lets keep condiments out of meal generation for now, can fix later
            toRet.push(
                {
                    name: fS.food["label"],
                    vars: [
                        { name: id, coef: 1.0 }
                    ],
                    bnds: { type: glpk.GLP_UP, ub: 0 }
                }
            );
        } else if (fS.required) { // we need at least the required amount for this food variable
            toRet.push(
                {
                    name: fS.food["label"],
                    vars: [
                        { name: id, coef: 1.0 }
                    ],
                    bnds: { type: glpk.GLP_DB, lb: fS.quantity, ub:fS.quantity+3 }
                }
            );
        } else { // Global limits to one each
            toRet.push(
                {
                    name: fS.food["label"],
                    vars: [
                        { name: id, coef: 1.0 }
                    ],
                    bnds: { type: glpk.GLP_DB, lb: 0, ub:1 }
                }
            );
        }
    }
    return toRet;
}
// validFoods is all the ids of foods we're considering for eating (really just used in case we do/don't want to include tier 1 in the future, since validFoods is made in a function that excludes tier 1's)
function createConstraints(board:any,v:boolean,ve:boolean,gf:boolean,k:number,f:number,c:number,p:number):any {
    // All foods must add up to macronutrients ratios and calorie limit
        // For stuff like required and banned, we can use the api for constraints; byoutiful
    // Each variable is a frequency of a food item, so there are as many as there are valid foods to choose from
        // Each equation represents one dimensions I'm constraining to: in this case let's assume it's just the three macronutrients and calories
    let gramsfat:number = (k*(f/100))/9; // number of calories divided by 9 calories per gram of fat
    let gramscarbohydrate:number = (k*(c/100))/4; // number of calories divided by 4 calories per gram of carbohydrate
    let gramsprotein:number = (k*(p/100))/4; // number of calories divided by 4 calories per gram of protein
    let calories:any = 
    {
    name: 'calories',
        vars: getCalVars(board),
        bnds: { type: glpk.GLP_DB, lb: k*0.9, ub: k*1.1 }
    };
    let fat:any = 
    {
    name: 'fat',
//USED TO:    // (total calories from fat/f%) - (total calories from carb/c%) = 0
// Due to the insane nature of the discrepancies between macrograms and calories (you get way fewer than you should), a much higher ceiling on them is reasonable
    // However, we should also add constraints of them relative to each other
        vars: getFatVars(f,true,board),
        bnds: { type: glpk.GLP_DB, lb: k*(f/100), ub: k*(f/100)*1.9 }
    };
    let carbohydrates:any = 
    {
    name: 'carbohydrates',
//USED TO:    // (total calories from fat/f%) - (total calories from protein/p%) = 0
        vars: getCarbVars(c,true,board),
        bnds: { type: glpk.GLP_DB, lb: k*(c/100), ub: k*(c/100)*1.9 },
    };
    let protein:any = 
    {
    name: 'protein',
//USED TO:    // (total calories from protein/p%) - (total calories from carb/c%) = 0
        vars: getProteinVars(p,true,board),
        bnds: { type: glpk.GLP_DB, lb: k*(p/100), ub: k*(p/100)*1.9 }
    };
    let reqbans:any = calculateRequiredsBanneds(board,v,ve,gf); // constraints for required/banned
    console.log("reconquista: "+reqbans.length);
    return (reqbans.length > 0)?[calories,fat,carbohydrates,protein].concat(reqbans):[calories,fat,carbohydrates,protein];
    // return [calories,fat,protein,carbohydrates].concat(reqbans);
}
function createIntegers(board:any,v:boolean,ve:boolean,gf:boolean,k:number,f:number,c:number,p:number):string[] {
    let toRet:string[] = [];
    for (const id in board) {
        // console.log("A Priori: "+(typeof board[property].required));
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            toRet.push(id);
        }
    }
    return toRet;
}
// For future refactor: just make the inputs these items from the Options interface (see method internal) 
function createOptions(board:any,v:boolean,ve:boolean,gf:boolean,k:number,f:number,c:number,p:number):any {
    // interface Options {
    //     mipgap?: number,    /* set relative mip gap tolerance to mipgap, default 0.0 */
    //     tmlim?: number,     /* limit solution time to tmlim seconds, default INT_MAX */
    //     msglev?: number,    /* message level for terminal output, default GLP_MSG_ERR */
    //     presol?: boolean,   /* use presolver, default true */
    //     cb?: {              /* a callback called at each 'each' iteration (only simplex) */
    //         call(result: Result),
    //         each: number
    //     }
    // }
    return {
        // mipgap:1000,
        msglev: glpk.GLP_MSG_ALL,
        // https://www.ibm.com/docs/en/icos/12.9.0?topic=parameters-relative-mip-gap-tolerance
            // Any number from 0.0 to 1.0; default: 1e-04.
            // 5% from optimal is good enough, but I'll make it rougher at first
        tmlim: 10
    };
}
// TODO Get rid of default values once no longer applicable
function solutionToSquares(solution:any,board:any):Food[] {
    console.log("CEE EHL GEE");
    // console.log(Object.entries(solution.result.vars));
    let foods:any = Object.entries(solution.result.vars);
    let k:number = 0;
    let f:number = 0;
    let c:number = 0;
    let p:number = 0;
    for (let i = 0; i < foods.length; i++) {
        let cur:any = board[foods[i][0]].food;
        if (foods[i][1] > 0) {
            console.log(cur["id"]+": "+cur["label"]+" x "+foods[i][1]);
        }
        k += foods[i][1]*(parseInt(cur["nutrition_details"]["calories"]["value"])?parseInt(cur["nutrition_details"]["calories"]["value"]):(9*10)+(4*10)+(4*10));
        f += foods[i][1]*(parseInt(cur["nutrition_details"]["fatContent"]["value"])?parseInt(cur["nutrition_details"]["fatContent"]["value"]):10);
        c += foods[i][1]*(parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"])?parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"]):10);
        p += foods[i][1]*(parseInt(cur["nutrition_details"]["proteinContent"]["value"])?parseInt(cur["nutrition_details"]["proteinContent"]["value"]):10);
        // console.log("Name: "+cur["label"]);
        // console.log(`calories: ${Object.entries(cur["nutrition_details"]["calories"])}`);
        // console.log(`fat: ${Object.entries(cur["nutrition_details"]["fatContent"])}`);
        // console.log(`carbs: ${Object.entries(cur["nutrition_details"]["carbohydrateContent"])}`);
        // console.log(`protein: ${Object.entries(cur["nutrition_details"]["proteinContent"])}`);
    }
    console.log("Caloria: "+k);
    console.log(`f: ${f}, c: ${c}, p: ${p}`);
    return [];
}
// k is kilocals
async function generateMeal(board:any,v:boolean,ve:boolean,gf:boolean,k:number,f:number,c:number,p:number):Promise<Food[]> {
    // Pretty basic
        // Overall plan: 
            // Some way to avoid stigler issues, don't want sucky meals
        // Objective (could be any of the following)
            // See createObjective
        // Constraints
            // See createConstraints
    // Next goal: Programmatically fill all these features with different functions
        // Could end up in a similar situation to the backend, where I see repeated work and then refactor into something more efficient
    let validFoods:string[] = createIntegers(board,v,ve,gf,k,f,c,p);
    const lp = {
        name: 'Meal Generation',
        objective: createObjective(board,v,ve,gf,k,f,c,p),
        subjectTo: createConstraints(board,v,ve,gf,k,f,c,p),
          /* integer */
        generals : validFoods
    };

    let filepath = "files/";
    let filename = "meal_mip";
    let dir_exists = fs.existsSync(filepath);
    if (!dir_exists) { // If the directory already exists
        await fs.promises.mkdir(filepath,{ recursive: true });
    }
    fs.writeFile(filepath+filename+".json", JSON.stringify(lp), function(err:any, buf:any ) {
        if(err) {
            console.log("error: ", err);
        } else {
            console.log("Meal Mip saved successfully!");
        }
    });

    const opt = createOptions(board,v,ve,gf,k,f,c,p);

    // console.log(
    // await (glpk.solve(lp, opt)
    // .then((res: any) => console.log(res))
    // .catch((err: any) => console.log(err))));
    return solutionToSquares(glpk.solve(lp, opt),board); /* Converts the solution into the food square object */
}
async function bonSiteUp():Promise<string> {
    // puppeteering
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    // Banner web schedule site
    await page.goto(bonSite(0), { timeout: 30000 } );

    // Inputting username/password
    await page.screenshot({path: 'files/screenshot0.png'});
    let content = await page.content();
    return content.toString().substring(2000,4000);
}
// Returns a list of foods from the site daysAgo number of days ago
// NOTE: Only call after you've downloaded menu
// Chosen is an array of valid meal indices
async function getMeal(page:any,chosen:meals,menu:any):Promise<Food[]> {
    await page.screenshot({path: 'files/screenshot1.png'});

    let toRet:Food[] = [];
    // Make sure to get from all meals and also from all food tiers
        // document.querySelector("#lunch .site-panel__daypart-tabs [data-key-index='0'] .h4")
        // Special: data-key-index 0
        // Additional: data-key-index 1
        // Condiment: data-key-index 2
    // Good for double-checking overall "#breakfast .script", has an array of all food IDs in meal

    // document.querySelector("#breakfast .site-panel__daypart-tabs [data-key-index='0'] .h4")
    let meals:string[] = ["breakfast", "lunch", "dinner"];
    let mealstrings:Set<string> = new Set<string>();
    mealstrings.add(meals[chosen]);
    console.log("Meals: "+meals[chosen]);
    for (let i:number = 0; i < meals.length; i++) {
        let mealstr = meals[i];
        if (mealstrings.has(mealstr)) { // if it's one of the meals specified
            await getFoods(page, i,foodTier.Special, toRet,menu);
            await getFoods(page, i,foodTier.Additional, toRet,menu);
            await getFoods(page, i,foodTier.Condiment, toRet,menu);
        }
    }
    return toRet;
}
// TODO Get the v,ve,gf status of all foods
// Pass in a page with foods to get
async function getFoods(page:any,meal:meals,tier:foodTier,toRet:Food[],menu:any):Promise<void> {
    let meals:string[] = ["breakfast", "lunch", "dinner"];
    const nn = await page.$$("#"+meals[meal]+" .site-panel__daypart-tabs [data-key-index='"+tier+"'] .h4"); // all foods in the meal
    for (let i = 0; i < nn.length; i++) {
        // function food_factory (id: number, name: string, calories:number, carbs: number, rote: number, phat: number, tear:foodTier, servingSize:number,servingUnits:string):Food {
        const id = ( await page.evaluate((el: { getAttribute: (arg0: string) => any; }) => el.getAttribute("data-id"), nn[i]));
        // console.log("data id: "+id);
        const name = menu[id]["label"];
        // console.log("fude name: "+name);
        // console.log(name);
        if ("nutrition_details" in menu[id] && Object.keys(menu[id]["nutrition_details"]).length > 0) {
            const calories = menu[id]["nutrition_details"]["calories"]["value"];
            const carbs = menu[id]["nutrition_details"]["carbohydrateContent"]["value"];
            const rote = menu[id]["nutrition_details"]["proteinContent"]["value"];
            const phat = menu[id]["nutrition_details"]["fatContent"]["value"];
            const servingSize = menu[id]["nutrition_details"]["servingSize"]["value"];
            const servingUnits = menu[id]["nutrition_details"]["servingSize"]["unit"];
            toRet.push(food_factory(id,name,calories,carbs,rote,phat,meal,tier,servingSize,servingUnits,false));
        } else {
            toRet.push(food_factory(id,name,0,0,0,0,meal,tier,0,"",true)); // Southwest Beef Bowl case
        }
    }
}
// Pass in a page with a valid menu
// ASSUMPTION: the idea of getting the menu from days ago (and this does matter, as the IDs shift), hinges on them having giving us consistent menu IDs within each day's site
// Returns an object with the menu with strings from the site daysAgo number of days ago
async function getMenu(page:any):Promise<string> {
    await page.screenshot({path: 'files/screenshot1.png'});

    // script containing the menu json
    let script = 
        await ( 
        await (
        await page.$(".panels-collection script")).getProperty('innerHTML') 
        ).jsonValue(); // document.querySelector(".panels-collection script").innerText

    // Literally just the substring past Bamco.menu_items to Bamco.cor_icons
    let startDex = script.indexOf("Bamco.menu_items")+"Bamco.menu_items".length+3;
    let endDex = script.indexOf("Bamco.cor_icons")-6;
    return script.substring(startDex,endDex);
}
async function writeDayData(daysAgo:number,dayta:any) {
    let filepath = "files/";
    let filename = formattedDate(daysAgo)+"_dayinfo";
    let dir_exists = fs.existsSync(filepath);
    if (!dir_exists) { // If the directory already exists
        await fs.promises.mkdir(filepath,{ recursive: true });
    }
    fs.writeFile(filepath+filename+".json", JSON.stringify(dayta), function(err:any, buf:any ) {
        if(err) {
            console.log("error: ", err);
        } else {
            console.log("Meals saved successfully!");
        }
    });
}
// Returns if DB/file storage for having the value
async function inDatabase(daysAgo:number):Promise<boolean> {
    let filepath = "files/";
    let filename = formattedDate(daysAgo)+"_dayinfo";
    return fs.existsSync(filepath+filename+".json");
}
// Only call if the meal is in the archive
async function outDatabase(daysAgo:number):Promise<string> {
    let filepath = "files/";
    let filename = formattedDate(daysAgo)+"_dayinfo";
    return await JSON.parse(await fs.promises.readFile(filepath+filename+".json"));
}
async function getMenusAndMeals(daysOffset:number):Promise<object> {
    let toRet:any = {};
    toRet["validMenus"] = {};
    toRet["validMeals"] = {};
    toRet["meals"] = {};
    // toRet["menus"] = {}; //so we don't include in the written json
    let menus:any = {};
    let meals:string[] = ["breakfast", "lunch", "dinner"];
    // Bon site
    let days:number[] = [0,5,6];
    for (let i:number = 0; i <= 2; i++) {
         // Added so we get the days relative to the given day; we want multiple days data corresponding to a single day
         // https://stackoverflow.com/questions/39269701/typescript-trying-the-addition-of-two-variables-but-get-the-concatenation-of-t
        let daysAgo:number = +days[i] + +daysOffset;
        // puppeteering
        const browser = await puppeteer.launch({headless: "new"});
        const page = await browser.newPage();
        await page.goto(bonSite(daysAgo), { timeout: 30000 } );
        let script = 
            await ( 
            await (
            await page.$(".panels-collection script")).getProperty('innerHTML') 
            ).jsonValue();
        toRet["validMenus"][daysAgo] = !(!(script));
        if (toRet["validMenus"][daysAgo]) { // valid day/menu
            toRet["validMeals"][daysAgo] = {};
            toRet["meals"][daysAgo] = {};
            menus[daysAgo] = await JSON.parse(await getMenu(page));
            for (let meal = 0; meal <= 2; meal++) {
                toRet["validMeals"][daysAgo][meals[meal]] = !(!(await page.$("#"+meals[meal]))); // valid meal
                if (toRet["validMeals"][daysAgo][meals[meal]]) {
                    console.log("Goethe was smartest, for sure");
                    toRet["meals"][daysAgo][meals[meal]] = await getMeal(page,meal,menus[daysAgo]); // NEVER FORGET AN AWAIT FML
                } else {
                    toRet["meals"][daysAgo][meals[meal]] = {};
                }
            }
        } else { // invalid day/menu
            menus[daysAgo] = {};
            toRet["validMeals"][daysAgo] = {};
            toRet["meals"][daysAgo] = {};
            for (let meal = 0; meal <= 2; meal++) { // invalid meals
                toRet["validMeals"][daysAgo][meals[meal]] = false;
                toRet["meals"][daysAgo][meals[meal]] = {};
            }
        }
    }
    return toRet;
}
// Overview
  // This API will allow for the maintenance and use of a webscraper for Rose-Hulman's publicly available meal data

// Commands: 
    // Verification (COMPLETE)
        // NOTE: Someone has to have already done 2FA before this works. I am using my credentials for this
        // Put - Overwrite old_banner_site.html. Only call when sure twe can process old_site.html
        // Get - The banner site is up/we logged in right (or at least has the html we expect)
        // Put - Overwrite old_public_site.html. Only call when sure we can process old_site.html
        // Get - The public site is up/we logged in right (or at least has the html we expect)
    // Data acquisition (COMPLETE)
        // NOTE: We can make this more flexible and parametrize by year, professor, etc. to update information in only parts of the db but waiting for mongodb first since I don't want to implement allat in json
        // NOTE: New folders for each new year represented, with each one containing the respective courses and sections jsons
        // Put - Write all courses from public site into 20XX_courseinfo.json. Year specified is the later of xxxx-yyyy, aka the year the class of yyyy graduates
            // courseinfo needs to be organized by department, then course id/name
        // Put - Write all sections from banner site into 20XX_sectioninfo.json (depends on corresponding courseinfo.json). // Write all courses from public site into 20XX_courseinfo.json. Year specified is the later of xxxx-yyyy, aka the year the class of yyyy graduates
            // sectioninfo needs to be organized by quarter, then department, then course id/name, then section/professor
        // Put - maybe later, also getting all of the descriptions could be fun
    // Data distribution - the fun stuff (IN PROGRESS)
        // A bunch of Gets, basically anything an actual DB can do, mixing and matching parameters to yoink appropriate records. Implementing this will be herculean with jsons, so just wait for and leverage mongodb or mysql when it comes around
        // Get - whether a class exists (to prevent invalid classes from being created)
        // Get - whether a section exists (to prevent invalid sections from being created) (if their section is empty so far and invisible,
        //       we'll ask if they can't find a section that anyone's been a part of; don't want to overwhelm with empty sections)
        // Get - any non-empty classes

// ISSUES: 
    // Error: Requesting main frame too early!
        // Seems to happen arbitrarily, just rerun
    // Everything is extremely slow and prone to errors as a result
        // Minimize repeated work (particularly at the bottleneck of scraping) and cache results to load more quickly
    // Nothing showing up in json
        // Make sure to await any promises
    // Addition of numbers causes string concatenation
        // +a + +b
        // dumb, ik
    // Not able to puppeteer
        // You need to make a new browser and/or page instance between page.goto uses
    // JS sets and maps are jank
        // Don't use them, and always make sure to use strict equality
    // Not able to send a body to the backend
        // You can't do this with get or head requests
    // Everything is broken upon refactor and takes forever to fix
        // Test functionality incrementally (akin to test-driven development), whether from the bottom up while implementing or from the top downwards afterwards
    // Bunch of %20s in api call
        // Don't put newlines, even if it looks better, the url string
    // How do I access the info stored in a result object?
        // Object.entries
    // In MIP hell
        // Formulation is king
            // And since I'm not good at it, Google's Stigler representation might as well be an anchor
        // The key to escaping is not trying to set solely an upper or lower bound, nor is it cleverly algebra-ing in ratio constraints
            // Also, it looks like I need to make sure that the objective has corresponding information (fat if fat is objective) to the constraints
                // Makes sense, how else would it know about the problem
        // Just account for the real fuzziness of the protein, fat, and carb translation to calories by having a nice fat double bound confidence interval around the expected value
        // This is getting into the realm of superstition, but maybe the success had to do with the fact that I changed everything to the same units
            // https://or.stackexchange.com/questions/8049/detect-numerical-instability-with-large-scale-optimization-problems
                // In general, I think it is difficult if not impossible to look at a model and say, prior to any computations, that it is going to be unstable ... with one exception. If the largest and smallest absolute values of nonzero constraint coefficients differ by too many orders of magnitude, then you are living dangerously. The model might still be stable, but a wide range of coefficient magnitudes raises the likelihood of instability. Looking at the objective coefficients, I don't know that a wide range of magnitudes would signal likely instability in the sense of basis matrices having large condition numbers, but it could signal potential rounding problems that might lead to suboptimal solutions. Some solvers provide an easy means to inspect the range of magnitudes.
            // It just seems like these problems are bullshit and you have to trial-and-error your way through
                // https://or.stackexchange.com/questions/834/best-practices-for-formulating-mips
                // Either that or painfully math: https://orinanobworld.blogspot.com/2010/08/ill-conditioned-bases-and-numerical.html
                    // https://or.stackexchange.com/questions/135/what-is-the-big-m-method-and-are-there-two-of-them
                    // https://orinanobworld.blogspot.com/2011/07/perils-of-big-m.html
                    // Or money: https://or.stackexchange.com/questions/8049/detect-numerical-instability-with-large-scale-optimization-problems
                        // Require tech support: https://support.gurobi.com/hc/en-us/community/posts/360050541152-High-instability-of-an-MIP-
    // Can't get protein, carbohydrates, and fats to play well together
        // If I get desperate enough, I can revert to java alg
        // Either that or https://docs.mosek.com/modeling-cookbook/mio.html
            // The cookbook recommended on https://developers.google.com/optimization/mip
            
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
    let meal:Food[] = await generateMeal(board,
        vegetarian==="true",
        vegan==="true",
        glutenfree==="true",
        calories,
        fratio,
        cratio,
        pratio); // returns an array of the foods

    res.send(meal);
});
// Read
router.get('/test/', async function(req:any, res:any) {
    res.send("Backend is up");
});
// RUN BEFORE FUTURE SCRAPING. Checks if the bon site is up/in the same format it was designed for
router.get('/scraping_up/', async function(req:any, res:any) {
    let content = await bonSiteUp(); // gets the public site html
    let prev = await fs.promises.readFile(archivedBonSite);
    res.send(content==prev?"public scraping is up":"public scraping is down");
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
    if (await inDatabase(daysAgo)) {
        res.send(await outDatabase(daysAgo));
        return;
    }
    let toWrite:any = await getMenusAndMeals(daysAgo);
    await writeDayData(daysAgo,toWrite);
    // Sorta arbitrary but I guess helps keep track of menu for each day
    res.send(toWrite);
});
// Update
// Overwrite old_bon_site.html. Only call when sure we can process old_site.html
router.put('/update_archive/',async function(req:any,res:any) {
    let content = await bonSiteUp(); // gets the banner site html
    fs.writeFile(archivedBonSite,content,function(err:any, buf:any) {
        if(err) {
            res.send("error writing: ", err);
        } else {
            res.send("success writing");
        }
    });
});

module.exports = router;