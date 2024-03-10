// Method prefixes
    // Read - Pull from DB
    // Get - Scraping
    // Has - Check in DB
    // Write - Write to DB

    var puppeteer = require('puppeteer');
    const { DateTime } = require("luxon");
    const fs = require("fs");
    var types = require('tedious').TYPES;
    var ConnectionM = require('tedious').Connection;
    var RequestM = require('tedious').Request;
    // var Promise = require('bluebird');
    import util from 'util';
    
    import type { Food } from "./constants_and_types";
    import type { nutritionDetails } from "./constants_and_types";
    import { foodTier } from "./constants_and_types";
    import { archivedBonSite } from "./constants_and_types";
    import {RestaurantMealsLoadStatus} from "./constants_and_types";
    import { convertToNutritioned } from './generative_ai_service';
    import { isRunnableFunctionWithParse } from 'openai/lib/RunnableFunction';
    
    // ScrapingService
    // Valid numbers of days ago: -1 < n <= whatever
    function bonSite(daysAgo:number):string {
        return 'https://rose-hulman.cafebonappetit.com/cafe/'+(daysAgo!=0?formattedDate(daysAgo):'');
    }
    // ScrapingService
    function formattedDate (daysAgo:number):string {
        let val = DateTime.now().minus({ days: daysAgo });
        return val.year+"-"+val.month.toString().padStart(2,'0')+"-"+val.day.toString().padStart(2,'0');
    }
    function floatFormat(nutrition:any):any {
        if (!nutrition) {
            return null;
        }
        if (nutrition = "<1") {
            return "0.5";
        }
        return parseFloat(nutrition);
    }
    function booleanToBit(bool:boolean) {
        return bool?1:0;
    }
    // ScrapingService
    // Pass in a page with a valid menu
    // ASSUMPTION: the idea of getting the menu from days ago (and this does matter, as the IDs shift), hinges on them having giving us consistent menu IDs within each day's site
    // Returns an object with the menu with strings from the site daysAgo number of days ago
    async function getPage(daysAgo:number) {
        const browser = await puppeteer.launch({headless: "new"});
        const page = await browser.newPage();
        await page.goto(bonSite(daysAgo), { timeout: 30000 } );
        return page;
    }
    
    //#region Meals
    // meals = ["breakfast", "lunch", "dinner"];
    // meals = ["brunch"];
    // meals = ["brunch", "dinner"];
    async function getMeal(daysAgo:number,mealstr:string):Promise<Food[]> {
        let toRet:Food[] = [];
        // Make sure to get from all meals and also from all food tiers
            // document.querySelector("#lunch .site-panel__daypart-tabs [data-key-index='0'] .h4")
            // Special: data-key-index 0
            // Additional: data-key-index 1
            // Condiment: data-key-index 2
        // Good for double-checking overall "#breakfast .script", has an array of all food IDs in meal
                // puppeteering
        const page = await getPage(daysAgo);
        let menu = await JSON.parse(await getMenu(page));
        // document.querySelector("#breakfast .site-panel__daypart-tabs [data-key-index='0'] .h4")
        console.log("Meal: "+mealstr);
        await getFoods(page, mealstr,foodTier.Special, toRet,menu);
        await getFoods(page, mealstr,foodTier.Additional, toRet,menu);
        await getFoods(page, mealstr,foodTier.Condiment, toRet,menu);
        return toRet;
    }
    async function hasMeal (daysAgo:number,mealstr:string):Promise<boolean> {
        const connection = await getNewConnection(false,true);
        let request = getRestaurantMealID(daysAgo,mealstr, connection);
        request.on('error', function (err:any) {
            throw err;
        });
        let rows1:any = await execSqlRequestDonePromise(request);
        return !(!(rows1.length));
    }
    async function readMeal (daysAgo:number,mealstr:string):Promise<Food[]> {
        let toRet:Food[] = [];

        const connection = await getNewConnection(false,true);
        let request = getRestaurantMealID(daysAgo,mealstr, connection);
        request.on('error', function (err:any) {
            throw err;
        });
        let rows1:any = await execSqlRequestDonePromise(request);
        let restaurantmealid:number = rows1[0][0].value; // first (and only) row, first (and only) column

        const connection2 = await getNewConnection(false,true);
        let request2 = readMealFromTable(restaurantmealid, connection2);
        let rows2:any = await execSqlRequestDonePromise (request2);
        rows2.forEach((columns:any) => {
            let toPush:Food = 
            convertFromFoodSchema(columns,mealstr);
            toRet.push(toPush);
        });
        
        // Here's the magic: the then() function returns a new promise, different from the original:
            // So if we await that then we're good on everything in the thens
        return toRet;
    }
    /** Write to RestaurantMeals and RestaurantMealsLoadStatus too */
    async function writeMeal (daysAgo:number,mealstr:string,foods:Food[]):Promise<any> {
        let connection = await getNewConnection(false,false);

        let request = insertMealAndStatus(daysAgo,mealstr, connection);
        request.on('error', function (err:any) {
            throw err;
        });
        let restaurantmealid:any = await callProcedureRequestOutputParamPromise (request);
console.log("rat meal: "+restaurantmealid);
        const connection2 = await getNewConnection(false,false);
        bulkLoadFood(foods, restaurantmealid, connection2); // it's okay if we don't await this because for inserts we just gotta run this in the background
                                                            // Also bulkload doesn't have any events
        connection2.on('error', async function (err:any) {
            // bulk load failed
            if (err) {
                // delete meal and mealstatus
                const connection3 = await getNewConnection(false,false);
                deleteMealAndStatus(restaurantmealid,connection3);
                throw err;
            }
        });
        
        return true;
    }
    async function getMenu(page:any):Promise<string> {
        // await page.screenshot({path: 'files/screenshot1.png'});
    
        // script containing the menu json
        let script = 
            await ( 
            await (
            await page.$(".panels-collection script")).getProperty('innerHTML') 
            ).jsonValue(); // document.querySelector(".panels-collection script").innerText
    
        // Literally just the substring past Bamco.menu_items to Bamco.cor_icons
        let startDex = script.indexOf("Bamco.menu_items = ")+"Bamco.menu_items = ".length;
        let endDex = script.indexOf("Bamco.cor_icons")-6;
        return script.substring(startDex,endDex);
    }
    async function getFoods(page:any,mealstr:string,tier:foodTier,toRet:Food[],menu:any):Promise<void> {
        const nn = await page.$$("#"+mealstr+" .site-panel__daypart-tabs [data-key-index='"+tier+"'] .h4"); // all foods in the meal
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
                toRet.push(food_factory(id,name,calories,carbs,rote,phat,mealstr,tier,servingSize,servingUnits,false,v,ve,gf));
            } else {
                toRet.push(food_factory(id,name,0,0,0,0,mealstr,tier,0,"",true,true,false,false)); // Southwest Beef Bowl case
            }
        }
    }
    // ScrapingService
    // Returns Food
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
    function food_factory_with_artificial_nutrition (id: number, name: string, calories:number, carbs: number, rote: number, phat: number, melie:string,tear:foodTier, servingSize:number,servingUnits:string,nutritionl:boolean,v:boolean,ve:boolean,gf:boolean,art_nut:boolean):Food {
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
            artificial_nutrition:art_nut,
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
    function getRestaurantMealID(day:number, meal:string, connection:any):any {
        let sql = 'select RestaurantMealID from RestaurantMeal where meal = @meal AND day = @date';
        let request = new RequestM(sql, function (err:any, rowCount:any, rows:any) {
            if (err) {
                throw err;
            }
        });

        request.addParameter('date', types.Date, new Date(formattedDate(day)));
        request.addParameter('meal', types.VarChar, meal);

        connection.execSql(request);
        return request;
    }
    function readMealFromTable (restaurantmealid:number,connection:any):any {
        let sql = 'select * from Food where RestaurantMealID = @mealid';
        let request = new RequestM(sql, function (err:any, rowCount:any, rows:any) {
            if (err) {
                throw err;
            }
        });

        request.addParameter('mealid', types.Int, restaurantmealid);

        connection.execSql(request);
        return request;
    }
    // Returns id of meal created
    function insertMealAndStatus(day:number, meal:string, connection:any):any {
        const request = new RequestM('insertMealAndStatus', (err:any, rowCount:any) => {
            if (err) { 
                // throw err;
                console.log(day+", "+meal);
            }
            connection.close();
        });
    
        // insertMealAndStatus (@day Date, @meal varchar(10))
    
        request.addParameter('day', types.Date, new Date(formattedDate(day)));
        request.addParameter('meal', types.VarChar, meal);
        request.addOutputParameter('restaurantmealid', types.Int);
    
        // In SQL Server 2000 you may need: connection.execSqlBatch(request);
        connection.callProcedure(request);
        // console.log(JSON.stringify(food));

        return request;
    }

    // Call upon failed bulk load
    function deleteMealAndStatus(restaurantmealid:number,connection:any) {
        const request = new RequestM('deleteMealAndStatus', (err:any, rowCount:any) => {
            if (err) { 
                throw err;
            }
            connection.close();
        });    
        request.addParameter('restaurantmealid', types.Int, restaurantmealid);
    
        connection.callProcedure(request);
    
        return request;
    }
    function bulkLoadFood(foods:Food[], restaurantmealid:number, connection:any) {
        const options = { keepNulls: true };
        // instantiate - provide the table where you'll be inserting to, options and a callback
        const bulkLoad = connection.newBulkLoad('Food', options, function (error:any, rowCount:any) {
            console.log("error: "+error);
            console.log('inserted %d rows', rowCount);
        });

        // setup your columns - always indicate whether the column is nullable
        bulkLoad.addColumn('ID', types.Int, { nullable: false }); // Maybe have to make [ID]
        bulkLoad.addColumn('Name', types.NVarChar, { length:50, nullable: false });
        bulkLoad.addColumn('Calories', types.Float, { nullable: true, precision:24 });
        bulkLoad.addColumn('Carbohydrates', types.Float, { nullable: true, precision:24 });
        bulkLoad.addColumn('Protein', types.Float, { nullable: true, precision:24 });
        bulkLoad.addColumn('Fat', types.Float, { nullable: true, precision:24 });
        bulkLoad.addColumn('Tier', types.TinyInt, { nullable: false });
        bulkLoad.addColumn('ServingSize', types.Float, { nullable: true, precision:24 });
        bulkLoad.addColumn('ServingUnits', types.NVarChar, { length:50, nullable: true });
        bulkLoad.addColumn('Nutritionless', types.Bit, { nullable: true });
        bulkLoad.addColumn('Vegetarian', types.Bit, { nullable: true });
        bulkLoad.addColumn('Vegan', types.Bit, { nullable: true });
        bulkLoad.addColumn('GlutenFree', types.Bit, { nullable: true });
        bulkLoad.addColumn('ArtificialNutrition', types.Bit, { nullable: true });
        bulkLoad.addColumn('RestaurantMealID', types.Int, { nullable: false });
    
        // execute
        connection.execBulkLoad(bulkLoad, convertToFoodSchema(foods,restaurantmealid));
    }
    
    function convertToFoodSchema(food:Food[],restaurantmealid:number):any {
        // change to checking <1 and null explicitly separately
        // TODO, use this, seems like my exact use case: https://tediousjs.github.io/tedious/bulk-load.html
        let toRet:any[] = [];
        for (let i:number = 0; i < food.length; i++) {
            let f:Food = food[i];
            toRet.push(
                {
                    ID:f.id,
                    Name:f.label,
                    Calories:floatFormat(f.nutrition_details.calories.value),
                    Carbohydrates:floatFormat(f.nutrition_details.carbohydrateContent.value),
                    Protein:floatFormat(f.nutrition_details.proteinContent.value),
                    Fat: floatFormat(f.nutrition_details.fatContent.value),
                    Tier:f.tier,
                    ServingSize:floatFormat(f.nutrition_details.servingSize.value),
                    ServingUnits:f.nutrition_details.servingSize.unit?f.nutrition_details.servingSize.unit:null,
                    Nutritionless:booleanToBit(f.nutritionless),
                    Vegetarian:booleanToBit(f.vegetarian),
                    Vegan:booleanToBit(f.vegan),
                    GlutenFree:booleanToBit(f.glutenfree),
                    ArtificialNutrition:booleanToBit(f.artificial_nutrition),
                    RestaurantMealID:restaurantmealid
                }
            );
        }
        return toRet;
    }

    function convertFromFoodSchema(row:any,mealstr:string):Food {
            let id = 0;
            let name = "";
            let calories = 0;
            let carbs = 0;
            let rote = 0;
            let phat = 0;

            let tier = 0;

            let nutritionless = false;
            let artificial_nutrition = false;

            let servingSize = 0;
            let servingUnits = "";
            let v = false;
            let ve = false;
            let gf = false;

            // let restaurantmealid = 0;
        row.forEach((column:any) => {
            let colName:string = column.metadata.colName;
            switch (colName) {
                case 'ID':
                    id = column.value;
                    break;
                case 'Name':
                    name = column.value;
                    break;
                case 'Calories':
                    calories = column.value;
                    break;
                case 'Carbohydrates':
                    carbs = column.value;
                    break;
                case 'Protein':
                    rote = column.value;
                    break;
                case 'Fat':
                    phat = column.value;
                    break;
                case 'Tier':
                    tier = column.value;
                    break;
                case 'ServingSize':
                    servingSize = column.value;
                    break;
                case 'ServingUnits':
                    servingUnits = column.value;
                    break;
                case 'Nutritionless':
                    nutritionless = column.value;
                    break;
                case 'Vegetarian':
                    v = column.value;
                    break;
                case 'Vegan':
                    ve = column.value;
                    break;
                case 'GlutenFree':
                    gf = column.value;
                    break;
                case 'ArtificialNutrition':
                    artificial_nutrition = column.value;
                    break;
                case 'RestaurantMealID':
                    // restaurantmealid = column.value;
                    break;
                default:
                  console.log(`New column name?!: ${colName}`);
              }
        });
            // the front end should also recoil in horror, separately
                // There should be a strikethrough /graying out of any non-veg in reqs or general list
            return food_factory_with_artificial_nutrition(id,name,calories,carbs,rote,phat,mealstr,tier,servingSize,servingUnits,nutritionless,v,ve,gf,artificial_nutrition);
    }
    //#endregion
    
    //#region MealNames
    async function getMealNames(daysAgo:number):Promise<string[]>{ // will add restaurant
        // document.querySelectorAll(".panel.s-wrapper.site-panel--daypart")[1].id
        let toRet:string[] = [];
        const page = await getPage(daysAgo);
        const nn = await page.$$(".panel.s-wrapper.site-panel--daypart"); // all meals in a day
        for (let i = 0; i < nn.length; i++) {
            const id = ( await page.evaluate((el: { getAttribute: (arg0: string) => any; }) => el.getAttribute("id"), nn[i]));
            console.log(id);
            toRet.push(id);
        }
        return toRet;
    }
    // Honestly, messing with sql isn't really worth for this one, I could just use jsons for each day...
        // But then how would I delete things every week?
            // Ez, use batch scripting
    async function hasMealNames(daysAgo:number):Promise<boolean> { // will add restaurant
        let filepath = "files/";
        let filename = formattedDate(daysAgo)+"_mealnames";
        return fs.existsSync(filepath+filename+".json");
    }
    async function readMealNames(daysAgo:number):Promise<any> { // will add restaurant
        // TODO
            // Get all of the foods of the specified restaurant, day, and mealtype
        let filepath = "files/";
        let filename = formattedDate(daysAgo)+"_mealnames";
        return JSON.parse(await fs.promises.readFile(filepath+filename+".json"));
    }
    async function writeMealNames(daysAgo:number,mealnames:string[]):Promise<any> {
        let filepath = "files/";
        let filename = formattedDate(daysAgo)+"_mealnames";
        let dir_exists = fs.existsSync(filepath);
        if (!dir_exists) { // If the directory already exists
            await fs.promises.mkdir(filepath,{ recursive: true });
        }
        fs.writeFile(filepath+filename+".json", JSON.stringify(mealnames), function(err:any, buf:any ) {
            if(err) {
                console.log("error: ", err);
            } else {
                console.log("Meal names saved successfully!");
            }
        });
    }
    // ScrapingService
    // Only call if the meal is in the archive
    // TODO, get rid of this as we SQL-ify, won't need to get everything so crudely every time
    //#endregion
    
    //#region ScrapingChecks
    // ScrapingService
    async function bonSiteUp():Promise<string> {
        // puppeteering
        const browser = await puppeteer.launch({headless: "new"});
        const page = await browser.newPage();
        // Banner web schedule site
        await page.goto(bonSite(0), { timeout: 30000 } );
    
        // Inputting username/password
        // await page.screenshot({path: 'files/screenshot0.png'});
        let content = await page.content();
        return content.toString().substring(2000,4000);
    }
    async function scrapingUp():Promise<boolean> {
        let content = await bonSiteUp(); // gets the public site html
        let prev = await fs.promises.readFile(archivedBonSite);
        return content==prev;
    }
    async function writeArchive():Promise<boolean> {
        let content = await bonSiteUp(); // gets the banner site html
        fs.writeFile(archivedBonSite,content,function(err:any, buf:any) {
            if(err) {
                return false;
            } else {
                return true;
            }
        });
        return false;
    }
    //#endregion
    
    //#region Connectivity
    // Options determine whether the callbacks for the constructor and done/doneProc/doneInProc will have the rows returned to the callback
    async function getNewConnection(rowCollectionOnRequestCompletion:boolean,rowCollectionOnDone:boolean):Promise<any> {
        var config = JSON.parse(fs.readFileSync("../Database/connectivity_config.json"));
        config.options.rowCollectionOnRequestCompletion = rowCollectionOnRequestCompletion;
        config.options.rowCollectionOnDone = rowCollectionOnDone;
        let toRet = new ConnectionM(config);
        let prom:Promise<any> = connectPromise(toRet);
        await prom;
        return toRet;
    }

    const connectPromise = (connection:any) => {
        return new Promise((resolve, reject) => {
            connection.connect((err: any) => {
                if (err) {
                    console.log('Connection Failed');
                    resolve(err);
                }
                console.log("Connection Succeeded!");
                resolve("Connection Succeeded!");
            });
        });
    }
    // Has both done and doneProc to cover all of the bases
    const execSqlRequestDonePromise = (request:any) => {
        return new Promise((resolve, reject) => {
            // This literally does it for subparts of the sproc (which could obvi lead to weird stuff if intermediate steps (table valued variables) 
                // are returned during a complex procedure)
                // But this should be fine so long as it's used for execSql requests and not callProcedure or something
            request.on('doneInProc',function (rowCount:any, more:any, rows:any) {
                // console.log('Jared Dunn (In Proc)!');
                resolve(rows);
            });
            request.on('done',function (rowCount:any, more:any, rows:any) {
                // console.log('Jared Dunn (NOT Proc)!');
                resolve(rows);
            });
            request.on('doneProc',function (rowCount:any, more:any, rows:any) {
                // console.log('Jared Dunn (Proc)!');
                resolve(rows);
            });
        });
    }

    const callProcedureRequestOutputParamPromise = (request:any) => {
        return new Promise((resolve, reject) => {
            // This literally does it for subparts of the sproc (which could obvi lead to weird stuff if intermediate steps (table valued variables) 
                // are returned during a complex procedure)
                // But this should be fine so long as it's used for execSql requests and not callProcedure or something
            request.on('returnValue', function(parameterName:any, value:any, metadata:any) {
                console.log('SPROC Returned!');
                resolve(value);
            });
        });
    }    
    //#endregion
    
    export {formattedDate,scrapingUp,writeArchive,getMealNames,hasMealNames,readMealNames,writeMealNames,getMeal,hasMeal,readMeal,writeMeal,getNewConnection,getRestaurantMealID,execSqlRequestDonePromise,booleanToBit}