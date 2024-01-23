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


import OpenAI from "openai";
var express = require('express');
var router = express.Router();
const fs = require("fs");
const { DateTime } = require("luxon");
const GLPK = require('glpk.js');
const glpk = GLPK();
const openai = new OpenAI();

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
    type Food = {    
        "id": number,
        "label": string,
        "description": string,
        "short_name": string,
        "raw_cooked": number,
        "meal":string,
        "tier":foodTier,
        "nutritionless":boolean,
        "artificial_nutrition":boolean,
        "nutrition": {
            "kcal": number,
            "well_being": number,
        },
        "vegetarian":boolean,
        "vegan":boolean,
        "glutenfree":boolean,
        "station_id": number,
        "station": string,
        "nutrition_details": nutritionDetails,
        "ingredients": string[],
        "sub_station_id": number,
        "sub_station": string,
        "sub_station_order": number,
        "monotony": {}
    }
    type FoodSquare = {
        food:any, /* Would be Food type, but string stuff */
        required:boolean,
        banned:boolean,
        quantity:number
    }
    type nutritionDetails = {
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
    }

    // Returns specific sections of courses
    function food_factory (id: number, name: string, calories:number, carbs: number, rote: number, phat: number, melie:string,tear:foodTier, servingSize:number,servingUnits:string,nutritionl:boolean,v:boolean,ve:boolean,gf:boolean):Food {
        const nDetails: nutritionDetails = {
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
    };
    const toRet: Food = {
        id: id,
        label: name,
        description: "string",
        short_name: "string",
        raw_cooked: 1010101,
        meal:melie,
        tier:tear,
        nutritionless:nutritionl,
        artificial_nutrition:false,
        nutrition: {
            kcal: calories,
            well_being: 1010101,
        },
        station_id: 1010101,
        station: "string",
        nutrition_details: nDetails,
        ingredients: ["string[]"],
        sub_station_id: 1010101,
        sub_station: "string",
        sub_station_order: 1010101,
        monotony: {},
        vegetarian:v,
        vegan:ve,
        glutenfree:gf
    };
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
// Creates a objective function
// Coefficents are normally distributed random numbers in the ballpark of the sum of macronutrients by having same mean, sd
function research(board:any,v:boolean,ve:boolean,gf:boolean,k:number,f:number,c:number,p:number):any {
    /*let toRet:any = [];
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

    let retAvg:number = average(toRet);
    let retSd:number = getStandardDeviation(toRet);
    console.log("Avg # calories: "+retAvg);
    console.log("Sd # calories: "+retSd);

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
    return toRet;*/
 
    /*// new research: using the objective function to incentivize proportional meals
    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["fatContent"]["value"]);
            if (!cal) {
                cal = 10;
            }            
            let cil = parseInt(fS.food["nutrition_details"]["carbohydrateContent"]["value"]);
            if (!cil) {
                cil = 10;
            }
            let col = parseInt(fS.food["nutrition_details"]["proteinContent"]["value"]);
            if (!col) {
                col = 10;
            }
            toRet.push({ name: id, coef: ((cal*9)/(f/100))+((cil*4)/(c/100))+((col*4)/(p/100))});
        }
    }
    return toRet;*/
 
    // new new research: maximizing tier 0, the main courses; if this ends up not being nuanced enough once we get all of the rest of the data, do weights with higher ones for tier 0 and lower for tiers 2 and 1
    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0) {
            toRet.push({ name: id, coef: 1.0});
        }
        if (fS.food["tier"] == 2) {
            toRet.push({ name: id, coef: -10});
        }
    }
    return toRet;
}
// TODO add better objectives; it seems you figure them out when you have a bad one and are repeatedly annoyed, forcing you to reevaluate your objective
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
            // ChatGPT generated parameters for every food, eg crunchiness or sweet/salt to make it more palatable than the apparently ridiculed stigler diet
    // Going with the simplest objective: 
        // Well the cost of all of the items would've been their frequencies added up since they were all normalized to quantities that had the same price
        // Since our normalized price is free, I'd say our objective would simply be to maximize z = 0*f1+0*f2+0*f3+... = 0
            // f1, f2, ... denote the food names, but I'll just use food ids or names to keep it simpler

        let objective:any = research(board,v,ve,gf,k,f,c,p); // works, maximizes specials
        // objective = getCalVars(board); works
        // objective = research(board,v,ve,gf,k,f,c,p); // works, used to just give normally distributed random numbers in the ballpark of the sum of macronutrients
        return {
        direction: glpk.GLP_MAX,
        name: 'Tier Zero Maximizer',
        vars: objective
    };
}
// TODO Null check won't matter, so I should get rid of the "default" (10*9)+(10*4)+(10*4) stuff
// Returns array of foods with corresponding calories
function getCalVars(board:any):any {
    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["calories"]["value"]);
            if (!cal) {
                cal = (10*9)+(10*4)+(10*4);
            }
            toRet.push({ name: id, coef: cal });
        }
    }
    return toRet;
}
// Returns array of variables for the constraint: 
// (total calories from fat/f%)-(total calories from protein/p%) = 0
function getFatProteinVars(f:number,p:number,board:any):any { // assumes all values in food nutritions are in grams
    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["fatContent"]["value"]);
            if (!cal) {
                cal = 10;
            }            
            let col = parseInt(fS.food["nutrition_details"]["proteinContent"]["value"]);
            if (!col) {
                col = 10;
            }
            toRet.push({ name: id, coef: ((cal*9)/(f/100))+((-1)*(col*4)/(p/100))});
        }
    }
    return toRet;
}
// Returns array of variables for the constraint: 
// (total calories from carbohydrate/c%)-(total calories from fat/f%) = 0
function getCarbFatVars(c:number,f:number,board:any):any {
    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["carbohydrateContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            
            let col = parseInt(fS.food["nutrition_details"]["fatContent"]["value"]);
            if (!col) {
                col = 10;
            }
            toRet.push({ name: id, coef: ((cal*4)/(c/100))+((-1)*(col*9)/(f/100))});
        }
    }
    return toRet;
}
// Returns array of variables for the constraint: 
// (total calories from protein/p%)-(total calories from carbohydrate/c%) = 0
function getProteinCarbVars(p:number,c:number,board:any):any { // assumes all values in foods are in grams
    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["proteinContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            
            let col = parseInt(fS.food["nutrition_details"]["carbohydrateContent"]["value"]);
            if (!col) {
                col = 10;
            }
            toRet.push({ name: id, coef: ((cal*4)/(p/100))+((-1)*(col*4)/(c/100))});
        }
    }
    return toRet;
}
// Returns array of variables for the constraint: 
// total calories from fat
function getFatVars(board:any):any { // assumes all values in foods are in grams
    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["fatContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet.push({ name: id, coef: (cal*9)});
        }
    }
    return toRet;
}
// Returns array of variables for the constraint: 
// total calories from carbohydrate
function getCarbVars(board:any):any { // assumes all values in foods are in grams
    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["carbohydrateContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet.push({ name: id, coef: (cal*4)});
        }
    }
    return toRet;
}
// Returns array of variables for the constraint: 
// total calories from protein
function getProteinVars(board:any):any { // assumes all values in foods are in grams
    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
            let cal = parseInt(fS.food["nutrition_details"]["proteinContent"]["value"]);
            if (!cal) {
                cal = 10;
            }
            toRet.push({ name: id, coef: (cal*4)});
        }
    }
    return toRet;
}
// TODO Add in dietary restrictions into calculation
function calculateRequiredsBanneds(board:any,v:boolean,ve:boolean,gf:boolean):any { // creates a bunch of single variable constraints for required/banned foods, dietary restrictions
    let duplicatesAllowed:number = 2;
    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (fS.banned || fS.food["tier"] == 1  || (v && !(fS.food.vegetarian)) || (ve && !(fS.food.vegan)) || (gf && !(fS.food.glutenfree))) { // lets keep condiments out of meal generation for now, can fix later
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
                    bnds: { type: glpk.GLP_DB, lb: fS.quantity, ub:duplicatesAllowed+fS.quantity }
                }
            );
        } else { // Global limits to one each
            toRet.push(
                {
                    name: fS.food["label"],
                    vars: [
                        { name: id, coef: 1.0 }
                    ],
                    bnds: { type: glpk.GLP_DB, lb: 0, ub:duplicatesAllowed }
                }
            );
        }
    }
    return toRet;
}
// validFoods is all the ids of foods we're considering for eating (really just used in case we do/don't want to include tier 1 in the future, since validFoods is made in a function that excludes tier 1's)
// lenience:number; how far the ratios can stray, must be 0 < lenience < 1
function createConstraints(board:any,v:boolean,ve:boolean,gf:boolean,k:number,f:number,c:number,p:number,lenience:number,use_int:boolean):any {
    // Each variable is a frequency of a food item, so there are as many as there are valid foods to choose from
        // Each equation represents one dimensions I'm constraining to: in this case let's assume it's just the three macronutrients and calories
    let calories:any = 
    {
    name: 'calories',
        vars: getCalVars(board),
        // Ranges predicated on meal caloric range being 500 to 1500
        bnds: { type: glpk.GLP_DB, lb: k<=1000?k*0.7:k*0.5, ub: k<=1000?k*0.9:k*0.7 } /** to account for using LPs and always rounding up */
            // Coupled with the max amount of repeats; 0.9 as an upper k works okay with max repeats of 2, ig but everythings inconsistent
    };
    if (use_int) {
        // calories["bnds"] = { type: glpk.GLP_DB, lb: k*0.9, ub: k*1.1 };
        // console.log("Saiki Gingko");
        // console.log("lower b: "+(k<=1000?k*0.7:k*0.5));
        // console.log("upper b: "+(k<=1000?k*0.9:k*0.7));
        calories["bnds"] = { type: glpk.GLP_DB, lb: k<=1000?k*0.7:k*0.5, ub: k<=1000?k*0.9:k*0.7 } /** to account for using LPs and always rounding up */
    }
    let constraints:any = [];
    let reqbans:any = calculateRequiredsBanneds(board,v,ve,gf); // constraints for required/banned
    if (!use_int) {
        // (total calories from fat/f%) - (total calories from protein/p%) = 0
        let fatProtein:any = 
        {
        name: 'fatProtein',
            vars: getFatProteinVars(f,p,board),
            bnds: { type: glpk.GLP_DB, lb: -1*lenience, ub: lenience }
        };
        // (total calories from carb/c%) - (total calories from fat/f%) = 0
        let carbohydratesFat:any = 
        {
        name: 'carbohydratesFat',
            vars: getCarbFatVars(c,f,board),
            bnds: { type: glpk.GLP_DB, lb: -1*lenience, ub: lenience }
        };
        // (total calories from protein/p%) - (total calories from carb/c%) = 0
        let proteinCarbohydrate:any = 
        {
        name: 'proteinCarbohydrate',
            vars: getProteinCarbVars(p,c,board),
            bnds: { type: glpk.GLP_DB, lb: -1*lenience, ub: lenience }
        };
        constraints = [calories,fatProtein,carbohydratesFat/*,proteinCarbohydrate*/].concat(reqbans);
    } else {
        // let calories:any = 
        // {
        // name: 'calories',
        //     vars: getCalVars(board),
        //     bnds: { type: glpk.GLP_DB, lb: k*0.9, ub: k*1.1 }
        // };
        let fat:any = 
        {
        name: 'fat',
    // Due to the insane nature of the discrepancies between macrograms and calories (you get way fewer than you should), a much higher ceiling on them is reasonable
        // However, we should also add jank 'constraints' of them relative to each other by limiting their sizes
            vars: getFatVars(board),
            bnds: { type: glpk.GLP_UP, ub: k*(f/100)*(1+lenience)}
        };
        let carbohydrates:any = 
        {
        name: 'carbohydrates',
            vars: getCarbVars(board),
            bnds: { type: glpk.GLP_LO, lb: k*(c/100)},
        };
        let protein:any = 
        {
        name: 'protein',
            vars: getProteinVars(board),
            bnds: { type: glpk.GLP_LO, lb: k*(p/100)}
        };
        constraints = [calories,fat,carbohydrates,protein].concat(reqbans);
    }
    // I could use the proteinCarbohydrate, but by the transitive property it's taken care of AS LONG AS BOUNDS ARE OKAY ON THE OTHER TWO
    return constraints; // the key was to use the techniques I learned; give the ratio breathing room (+- 0.1), try both giving and not giving extra information (symmetric eq), realuze that my problem is so simple relative to others' that glpk can prbably do it (why I had the confidence to search for the rror code that allowed me to realize the reason why protein and protein2 weren't enough were due to the lack of an overall calorie constraint; sometimes information is useful, sometimes it's bad. it needs breathing room to solve, but not infinite breathing room)
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
// TODO For future refactor: just make the inputs these items from the Options interface (see method internal) 
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
        msglev: /*glpk.GLP_MSG_ALL*/glpk.GLP_MSG_OFF,
        // https://www.ibm.com/docs/en/icos/12.9.0?topic=parameters-relative-mip-gap-tolerance
            // Any number from 0.0 to 1.0; default: 1e-04.
            // 5% from optimal is good enough, but I'll make it rougher at first
        tmlim: 10
    };
}
// TODO Get rid of default values once no longer applicable
function solutionToFoods(solution:any,board:any):FoodSquare[] {
    // console.log("GENERATED MEAL: ");
    let toRet:any = [];
    let foods:any = Object.entries(solution.result.vars);
    // console.log("Solution worked?"+((solution.result.status==glpk.GLP_FEAS)||(solution.result.status==glpk.GLP_OPT)||(solution.result.status==glpk.GLP_UNBND)));
    // console.log("Solution didn't worked?"+((solution.result.status==glpk.GLP_UNDEF)||(solution.result.status==glpk.GLP_INFEAS)||(solution.result.status==glpk.GLP_NOFEAS)||(solution.result.status==glpk.GLP_UNBND)));
    let k:number = 0;
    let f:number = 0;
    let c:number = 0;
    let p:number = 0;

    let k1:number = 0;
    let f1:number = 0;
    let c1:number = 0;
    let p1:number = 0;
    for (let i = 0; i < foods.length; i++) {
        let cur:any = board[foods[i][0]].food;
        let qty:number = Math.ceil(foods[i][1]);
        if (foods[i][1] > 0) {
            console.log(cur["id"]+": "+cur["label"]+" x "+foods[i][1]);
            let toPush:FoodSquare = {
                food:cur,
                required:false,
                banned:false,
                quantity:qty
            }
            toRet.push(toPush);
        }
        k += qty*(parseInt(cur["nutrition_details"]["calories"]["value"])?parseInt(cur["nutrition_details"]["calories"]["value"]):(9*10)+(4*10)+(4*10));
        f += qty*(parseInt(cur["nutrition_details"]["fatContent"]["value"])?parseInt(cur["nutrition_details"]["fatContent"]["value"]):10);
        c += qty*(parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"])?parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"]):10);
        p += qty*(parseInt(cur["nutrition_details"]["proteinContent"]["value"])?parseInt(cur["nutrition_details"]["proteinContent"]["value"]):10);

        k1 += foods[i][1]*(parseInt(cur["nutrition_details"]["calories"]["value"])?parseInt(cur["nutrition_details"]["calories"]["value"]):(9*10)+(4*10)+(4*10));
        f1 += foods[i][1]*(parseInt(cur["nutrition_details"]["fatContent"]["value"])?parseInt(cur["nutrition_details"]["fatContent"]["value"]):10);
        c1 += foods[i][1]*(parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"])?parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"]):10);
        p1 += foods[i][1]*(parseInt(cur["nutrition_details"]["proteinContent"]["value"])?parseInt(cur["nutrition_details"]["proteinContent"]["value"]):10);
    }
    // console.log("Calories (Predicted): "+k1);
    // console.log(`f: ${f1}, c: ${c1}, p: ${p1}`);
    // console.log("Calories (Actual): "+k);
    // console.log(`f: ${f}, c: ${c}, p: ${p}`);
    return toRet;
}

// Leniency is the degree to which we're willing to fudge constraints
    // Only one to keep things simple and bounds symmetric
async function generateMeal(board:any,v:boolean,ve:boolean,gf:boolean,k:number,f:number,c:number,p:number,leniency:number,use_int:boolean):Promise<FoodSquare[]> {
    let lp:any = {
        name: 'Meal Generation',
        objective: createObjective(board,v,ve,gf,k,f,c,p),
        subjectTo: createConstraints(board,v,ve,gf,k,f,c,p,leniency,use_int),
          /* integer */
    };
    if (use_int) {
        let validFoods:string[] = createIntegers(board,v,ve,gf,k,f,c,p);
        lp.generals = validFoods; // Don't need to do integers, np-hard and doesn't work with the constraints
    }

    // let filepath = "files/";
    // let filename = "meal_mip";
    // let dir_exists = fs.existsSync(filepath);
    // if (!dir_exists) { // If the directory already exists
    //     await fs.promises.mkdir(filepath,{ recursive: true });
    // }
    // fs.writeFile(filepath+filename+".json", JSON.stringify(lp), function(err:any, buf:any ) {
    //     if(err) {
    //         console.log("error: ", err);
    //     } else {
    //         console.log("Meal Mip saved successfully!");
    //     }
    // });

    const opt = createOptions(board,v,ve,gf,k,f,c,p);
    let solution = await glpk.solve(lp, opt);
    return solutionToFoods(solution,board); /* Converts the solution into the food square object */
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
async function getMeal(page:any,chosen:number,meals:string[],menu:any):Promise<Food[]> {
    // await page.screenshot({path: 'files/screenshot1.png'});

    let toRet:Food[] = [];
    // Make sure to get from all meals and also from all food tiers
        // document.querySelector("#lunch .site-panel__daypart-tabs [data-key-index='0'] .h4")
        // Special: data-key-index 0
        // Additional: data-key-index 1
        // Condiment: data-key-index 2
    // Good for double-checking overall "#breakfast .script", has an array of all food IDs in meal

    // document.querySelector("#breakfast .site-panel__daypart-tabs [data-key-index='0'] .h4")
    let mealstrings:Set<string> = new Set<string>();
    mealstrings.add(meals[chosen]);
    for (let i:number = 0; i < meals.length; i++) {
        let mealstr = meals[i];
        if (mealstrings.has(mealstr)) { // if it's one of the meals specified
            console.log("Meals: "+mealstr);
            await getFoods(page, i,meals,foodTier.Special, toRet,menu);
            await getFoods(page, i,meals,foodTier.Additional, toRet,menu);
            await getFoods(page, i,meals,foodTier.Condiment, toRet,menu);
        }
    }
    return toRet;
}
// TODO Get the v,ve,gf status of all foods
// Pass in a page with foods to get
async function getFoods(page:any,meal:number,meals:string[],tier:foodTier,toRet:Food[],menu:any):Promise<void> {
    const nn = await page.$$("#"+meals[meal]+" .site-panel__daypart-tabs [data-key-index='"+tier+"'] .h4"); // all foods in the meal
    for (let i = 0; i < nn.length; i++) {
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
            
            const v = ("cor_icon" in menu[id]) && ("1" in menu[id]["cor_icon"]); // if there is no cor_icon then consider using gpt-ing, but prlly good enough to assume meat
            const ve = ("cor_icon" in menu[id]) && ("4" in menu[id]["cor_icon"]); // may be subject to update
            const gf = ("cor_icon" in menu[id]) && ("9" in menu[id]["cor_icon"]);

            if (name.includes("tuscan chicken and kale stew")) {
                console.log("tuscan food: "+name);
                console.log("fooed veg?: "+(("cor_icon" in menu[id]) && ("1" in menu[id]["cor_icon"])));

                console.log("vegetarian: "+v);
                console.log("vegan: "+ve);
                console.log("gluten free: "+gf);
            }

            // the front end should also recoil in horror, separately
                // There should be a strikethrough /graying out of any non-veg in reqs or general list
            toRet.push(food_factory(id,name,calories,carbs,rote,phat,meals[meal],tier,servingSize,servingUnits,false,v,ve,gf));
        } else {
            toRet.push(food_factory(id,name,0,0,0,0,meals[meal],tier,0,"",true,true,false,false)); // Southwest Beef Bowl case
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
async function outDatabase(daysAgo:number):Promise<any> {
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
    let meals:string[] = [];
    
    // Bon site TODO Update when doing future testing
    let days:number[] = [0,1,-1];
    for (let i:number = 0; i <= 2; i++) {
        // Added so we get the days relative to the given day; we want multiple days data corresponding to a single day
        // https://stackoverflow.com/questions/39269701/typescript-trying-the-addition-of-two-variables-but-get-the-concatenation-of-t
        let daysAgo:number = +days[i] + +daysOffset;
        let val:any = DateTime.now().minus({ days: daysAgo });

        let dayOfWeek:number = val.weekday;
        if (1 <= dayOfWeek && dayOfWeek <= 5) {// m-f
            meals = ["breakfast", "lunch", "dinner"];
        } else if (dayOfWeek == 6) { // saturday
            meals = ["brunch"];
        } else if (dayOfWeek == 7) { // sunday
            meals = ["brunch", "dinner"];
        }

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
            for (let meal = 0; meal < meals.length; meal++) {
                toRet["validMeals"][daysAgo][meals[meal]] = !(!(await page.$("#"+meals[meal]))); // valid meal
                // console.log("#meal"+meal);
                if (toRet["validMeals"][daysAgo][meals[meal]]) {
                    toRet["meals"][daysAgo][meals[meal]] = await getMeal(page,meal,meals,menus[daysAgo]); // NEVER FORGET AN AWAIT FML
                } else {
                    toRet["meals"][daysAgo][meals[meal]] = {};
                }
            }
        } else { // invalid day/menu
            menus[daysAgo] = {};
            toRet["validMeals"][daysAgo] = {};
            toRet["meals"][daysAgo] = {};
            for (let meal = 0; meal < meals.length; meal++) { // invalid meals
                toRet["validMeals"][daysAgo][meals[meal]] = false;
                toRet["meals"][daysAgo][meals[meal]] = {};
            }
        }
    }
    return toRet;
}
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
// Returns the merged meal and artificial data TODO
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
        // SOLUTION: Check your math, don't multiply where you should divide, vice versa
    // I got protein, carbohydrates, and fats to play well together, but now it never converges
        // Go to linear programming, and just ceiling after setting a caloric threshold below what works
        // Tested: 0.9*calories upper bound, 2 duplicates at most for each
            // Works within about 100 calories for meals between 500 and 1500 calories
        // It seems there's no free lunch with this linear programming/optimization business
            // But by staring at the things that are annoying for long enough and coming up with an opposing constraint/objective, you can actually solve things
                // Like, despite it being likely an artefact of the data, only upper bounding fat and iteratively widening the allowance until success for the best possible answer
    // Requiring not working
        // I had to set the quantity to 1 by default
    // PayloadTooLargeError
        // Okay, so a band-aid is 
            /**app.use(myParser.json({limit: '200mb'}));
               app.use(myParser.urlencoded({limit: '200mb', extended: true})); */
            // But the real solution could be modifying the way I'm posting and responding with the entire meals
            // To instead use a date sent and an id in lieu of the massive food object, and then just picking up the relevant menu from save file
                // I don't actually have to do that, I just thought of it and that should be fine for this case
    // Circular reference error when writing object to json
        // It's not js magic, I actually just had a jank line where I set the id parameter of an object to itself
    // Should I ban foods for veg/vegan through the front or the back end?
        // Front end, because people may have carry-over sessions from previous days and this way we don't have to have the food data for every possible day on the back end
    // Brunch not loading
        // use datetime.weekday and check for 6 (brunch only) and 7 (brunch and dinner)
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
    let meal:FoodSquare[] = await generateMeal(board,
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
        meal = await generateMeal(board,
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
    let toWrite:any = [];
    if (await inDatabase(daysAgo)) {
        toWrite = await outDatabase(daysAgo);
    } else {
        toWrite = await getMenusAndMeals(daysAgo);
        await writeDayData(daysAgo,toWrite);
    }
    // If the gpt file exists, merge these together and send it as meals out
    // If it's already been done, then don't either
    let filepath = "files/";
    let filename = formattedDate(daysAgo)+"_gpt_nutrition";
    if (fs.existsSync(filepath+filename+".json")) {
        await mergeArtificialData(toWrite,daysAgo);
    }

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
router.put('/generate_artificial_data/:daysAgo/:password',async function(req:any,res:any) {
    if (req.params.password != "kriskringle") {
        return;
    }
    let daysAgo = req.params.daysAgo;
    let filepath = "files/";
    let filename = formattedDate(daysAgo)+"_dayinfo";
    // If the file doesn't exist
    if (!(fs.existsSync(filepath+filename+".json"))) { // Structured like this because I don't want to spend too much time messing with file processing stuff that will get refactored away, and have code that can be reused
        res.send("Can't GPT what doesn't exist");
        return;
    }
    // If it's already been done, then don't either
    if (fs.existsSync(filepath+formattedDate(daysAgo)+"_gpt_nutrition.json")) {
        res.send("Can't GPT what already has been");
        return;
    }

    // now it's gpt time
    // get all the nutritionless from chosen file
    let nutritionlesses:any = await getNutritionless(daysAgo);
    // get all nutritions from the nutritionlesses
        // Key considerations
            // Failing loudly
    // returns all of the nutritions by id
        // this way we can iterate through and match up with raw meal easily
    await convertToNutritioned(nutritionlesses);

    // Save in a file
    fs.writeFile(filepath+formattedDate(daysAgo)+"_gpt_nutrition.json", JSON.stringify(nutritionlesses), function(err:any, buf:any ) {
        if(err) {
            res.send("error: ", err);
        } else {
            res.send("GPT data saved successfully!");
        }
    });
});

module.exports = router;