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

// ScrapingService
// Pass in a page with a valid menu
// ASSUMPTION: the idea of getting the menu from days ago (and this does matter, as the IDs shift), hinges on them having giving us consistent menu IDs within each day's site
// Returns an object with the menu with strings from the site daysAgo number of days ago
async function getPage(daysAgo:number) {
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    return await page.goto(bonSite(daysAgo), { timeout: 30000 } );
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
    throw "Implement me";

}
async function readMeal (daysAgo:number,mealstr:string):Promise<Food[]> {
    throw "Implement me";

}
/** Write to RestaurantMeals and RestaurantMealsLoadStatus too */
async function writeMeal (daysAgo:number,mealstr:string,foods:Food[]):Promise<any> {
    var config = JSON.parse(fs.readFileSync("../Database/connectivity_config.json"));
    let promiseArr:Promise<any>[] = [];
    for (let i = 0; i < foods.length; i++) {
        let food = foods[i];
        const connection = new ConnectionM(config);
        let prom:Promise<any> = connectPromise(connection);
        prom.then(() => importFood(food, daysAgo, mealstr, connection))
        promiseArr.push(prom);
    }
    return Promise.all(promiseArr);
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
function importFood(food:any, day:any, meal:any, connection:any) {
    // food = '{"id":"5423187","label":"yogurt vanilla low fat","description":"string","short_name":"string","raw_cooked":1010101,"meal":"dinner","tier":2,"nutritionless":false,"artificial_nutrition":false,"nutrition":{"kcal":"60","well_being":1010101},"station_id":1010101,"station":"string","nutrition_details":{"calories":{"value":"60","unit":"string"},"servingSize":{"value":"0.3","unit":"oz"},"fatContent":{"value":"1","unit":"string"},"carbohydrateContent":{"value":"9","unit":"string"},"proteinContent":{"value":"3","unit":"string"}},"ingredients":["string[]"],"sub_station_id":1010101,"sub_station":"string","sub_station_order":1010101,"monotony":{},"vegetarian":true,"vegan":false,"glutenfree":true}';
    // meal="breakfast";
    // console.log("CUHZIN: "+JSON.stringify(food));
    const request = new RequestM('insertFood', (err:any, rowCount:any) => {
      if (err) { 
        // throw err;   
        console.log(food.label+", "+food.tier);
      }
    //   console.log('DONE!');
      connection.close();
    });

    food.nutrition_details.calories.value = parseFloat(food.nutrition_details.calories.value)?parseFloat(food.nutrition_details.calories.value):"0.5";
    food.nutrition_details.carbohydrateContent.value = parseFloat(food.nutrition_details.carbohydrateContent.value)?parseFloat(food.nutrition_details.carbohydrateContent.value):"0.5";
    food.nutrition_details.fatContent.value = parseFloat(food.nutrition_details.fatContent.value)?parseFloat(food.nutrition_details.fatContent.value):"0.5";
    food.nutrition_details.proteinContent.value = parseFloat(food.nutrition_details.proteinContent.value)?parseFloat(food.nutrition_details.proteinContent.value):"0.5";
    request.addParameter('json', types.VarChar, JSON.stringify(food));
    request.addParameter('date', types.Date, new Date(formattedDate(day)));
    request.addParameter('meal', types.VarChar, meal);

    // In SQL Server 2000 you may need: connection.execSqlBatch(request);
    connection.callProcedure(request);
    // console.log(JSON.stringify(food));
}
//#endregion

//#region MealNames
async function getMealNames(daysAgo:number):Promise<string[]>{ // will add restaurant
    // document.querySelectorAll(".panel.s-wrapper.site-panel--daypart")[1].id
    let toRet:string[] = [];
    const page = await getPage(daysAgo);
    const nn = await page.$$(".panel.s-wrapper.site-panel--daypart"); // all meals in a day
    for (let i = 0; i < nn.length; i++) {
        const id = ( await page.evaluate((el: { getAttribute: (arg0: string) => any; }) => el.getAttribute("data-id"), nn[i]));
        console.log(id);
        toRet.push(id);
    }
    return toRet;
}
async function hasMealNames () {
    throw "Implement me";
}
async function readMealNames () {
    throw "Implement me";
    
}
async function writeMealNames () {
    throw "Implement me";
    
}
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
// ScrapingService
// Returns if DB/file storage for having the value
async function inDatabase(daysAgo:number):Promise<boolean> {
    // TODO Refactor to query the status table once it exists
        // If it's anything but completed send back something verbose enough to indicate the loading progress
        // The keys are restaurant, day, and mealtype
    let filepath = "files/";
    let filename = formattedDate(daysAgo)+"_dayinfo";
    return fs.existsSync(filepath+filename+".json");
}
// ScrapingService
// Only call if the meal is in the archive
// TODO, get rid of this as we SQL-ify, won't need to get everything so crudely every time
async function outDatabase(daysAgo:number):Promise<any> {
    // TODO 
        // Get all of the foods of the specified restaurant, day, and mealtype
    let filepath = "files/";
    let filename = formattedDate(daysAgo)+"_dayinfo";
    return await JSON.parse(await fs.promises.readFile(filepath+filename+".json"));
}
const connectPromise = (connection:any) => {
    return new Promise((resolve, reject) => {
        connection.connect((err: any) => {
            if (err) {
                console.log('Connection Failed');
                resolve(err);
            }
            resolve("Connection Succeeded!");
        });
    });
}
//#endregion

export {formattedDate,inDatabase,outDatabase,scrapingUp,writeArchive,getMealNames,hasMealNames,readMealNames,writeMealNames,getMeal,hasMeal,readMeal,writeMeal}