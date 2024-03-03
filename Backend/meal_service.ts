// MealService
// Creates a tier-zero maximized objective function
function tZeroObjective(board:any,v:boolean,ve:boolean,gf:boolean,k:number,f:number,c:number,p:number):any {
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
// MealService
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

        let objective:any = tZeroObjective(board,v,ve,gf,k,f,c,p); // works, maximizes specials
        // objective = getCalVars(board); works
        // objective = research(board,v,ve,gf,k,f,c,p); // works, used to just give normally distributed random numbers in the ballpark of the sum of macronutrients
        return {
        direction: glpk.GLP_MAX,
        name: 'Tier Zero Maximizer',
        vars: objective
    };
}
// MealService
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
// MealService
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
// MealService
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
// MealService
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
// MealService
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
// MealService
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
// MealService
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
// MealService
// TODO Add in dietary restrictions into calculation
function calculateRequiredsBanneds(board:any,v:boolean,ve:boolean,gf:boolean):any { // creates a bunch of single variable constraints for required/banned foods, dietary restrictions
    let duplicatesAllowed:number = 2;
    let toRet:any = [];
    for (const id in board) {
        const fS = board[id]; // foodSquare
        if (v && ve) {
            v = false; // vegan will be both, looks like they don't always reflect this
        }
        if (fS.banned || fS.food["tier"] == 1  || (v && !(fS.food.vegetarian || fS.food.vegan)) || (ve && !(fS.food.vegan)) || (gf && !(fS.food.glutenfree))) { // lets keep condiments out of meal generation for now, can fix later
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
// MealService
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
// MealService
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
// MealService
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
// MealService
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
// MealService
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
