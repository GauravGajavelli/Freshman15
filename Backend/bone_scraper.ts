console.log("Hello Bon");

var express = require('express');
var router = express.Router();
const fs = require("fs");
const { DateTime } = require("luxon");

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
function food_factory (id: number, name: string, calories:number, carbs: number, rote: number, phat: number, melie:meals,tear:foodTier, servingSize:number,servingUnits:string):Food {
    const toRet: Food = {
        id: id,
        label: name,
        description: "string",
        short_name: "string",
        raw_cooked: 1010101,
        meal:melie,
        tier:tear,
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
async function getMeals(daysAgo:number,chosen:Set<meals>,menu:any):Promise<Food[]> {
    // puppeteering
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    // Bon site
    await page.goto(bonSite(daysAgo), { timeout: 30000 } );
    console.log("Site visited: "+bonSite(daysAgo));
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
    for (const value of chosen) {
        mealstrings.add(meals[value]);
        console.log("Meals: "+meals[value]);
    }
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
async function getFoods(page:any,meal:meals,tier:foodTier,toRet:Food[],menu:any):Promise<void> {
    let meals:string[] = ["breakfast", "lunch", "dinner"];
    const nn = await page.$$("#"+meals[meal]+" .site-panel__daypart-tabs [data-key-index='"+tier+"'] .h4"); // all foods in the meal
    for (let i = 0; i < nn.length; i++) {
        // function food_factory (id: number, name: string, calories:number, carbs: number, rote: number, phat: number, tear:foodTier, servingSize:number,servingUnits:string):Food {
        const id = ( await page.evaluate((el: { getAttribute: (arg0: string) => any; }) => el.getAttribute("data-id"), nn[i]));
        // console.log("data id: "+id);
        const name = menu[id]["label"];
        // console.log(name);
        if ("nutrition_details" in menu[id] && Object.keys(menu[id]["nutrition_details"]).length > 0) {
            const calories = menu[id]["nutrition_details"]["calories"]["value"];
            const carbs = menu[id]["nutrition_details"]["carbohydrateContent"]["value"];
            const rote = menu[id]["nutrition_details"]["proteinContent"]["value"];
            const phat = menu[id]["nutrition_details"]["fatContent"]["value"];
            const servingSize = menu[id]["nutrition_details"]["servingSize"]["value"];
            const servingUnits = menu[id]["nutrition_details"]["servingSize"]["unit"];
            toRet.push(food_factory(id,name,calories,carbs,rote,phat,meal,tier,servingSize,servingUnits));
        } else {
            toRet.push(food_factory(id,name,0,0,0,0,meal,tier,0,"")); // Southwest Beef Bowl case
        }
    }
}
// function hasNutrition (details:any):boolean {
//     let keys = Object.keys(details);
//     console.log("crimbo: "+keys);
//     for (let i = 0; i < keys.length; i++) {
//         // console.log("deets: "+Object.keys(details[keys[i]]));
//         // console.log("gloeorm: "+details[keys[i]]["value"]);
//         if (details[keys[i]] == null) {
//             return false;
//         }
//     }
//     return true;
// }

// ASSUMPTION: the idea of getting the menu from days ago (and this does matter, as the IDs shift), hinges on them having giving us consistent menu IDs within each day's site
// Returns a json of the menu with strings from the site daysAgo number of days ago
async function getMenu(daysAgo:number):Promise<string> {
    // puppeteering
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    // Bon site
    await page.goto(bonSite(daysAgo), { timeout: 30000 } );
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
async function writeMeals(daysAgo:number,meals:Food[],chosen:Set<meals>) {
    let filepath = "files/";
    let filename = Array.from(chosen).join('-')+"-"+formattedDate(daysAgo)+"_meals";
    let data = meals;
    let dir_exists = fs.existsSync(filepath);
    if (!dir_exists) { // If the directory already exists
        await fs.promises.mkdir(filepath,{ recursive: true });
    }
    fs.writeFile(filepath+filename+".json", JSON.stringify(data), function(err:any, buf:any ) {
        if(err) {
            console.log("error: ", err);
        } else {
            console.log("Meals saved successfully!");
        }
    });
}
// Returns if DB/file storage for having the value
async function inArchive(daysAgo:number,chosen:Set<meals>):Promise<Boolean> {
    let filepath = "files/";
    let filename = Array.from(chosen).join('-')+"-"+formattedDate(daysAgo)+"_meals";
    return fs.existsSync(filepath+filename+".json");
}

// Only call if the meal is in the archive
async function readMeal(daysAgo:number,chosen:Set<meals>):Promise<String> {
    let filepath = "files/";
    let filename = Array.from(chosen).join('-')+"-"+formattedDate(daysAgo)+"_meals";
    return await JSON.parse(await fs.promises.readFile(filepath+filename+".json"));
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
// Write all meal data from xxxx days ago to tables
router.put('/load_meals/:daysAgo',async function(req:any,res:any) {
    let daysAgo:number = req.params.daysAgo;
    // Valid days ago checking
    // Get menu object.
    // Get all foods in an array using the menu object
        // let foods = await getMeals(daysAgo,menu);
    // Writing to a sqlserver db

    if (daysAgo < -1) {
        res.send("Invalid day: "+daysAgo);
        return;
    }
    // Since summer registrations are over and the public site will be aimed at potential new students, it'll switch over in May to the next school year.
    // Before April it will probably not have switched and therefore the next year will not yet be valid.

    let menu = await JSON.parse(await getMenu(daysAgo));
    // let 
    let mealSet = new Set<meals>();
    mealSet.add(meals.Breakfast);
    mealSet.add(meals.Lunch);
    mealSet.add(meals.Dinner);
    let toWrite:Food[] = await getMeals(daysAgo,mealSet,menu);
    await writeMeals(daysAgo,toWrite,mealSet);
    fs.writeFile("files/menu.json",JSON.stringify(menu),function(err:any,buf:any) {
        if(err) {
            res.send("error writing: ", err);
        } else {
            res.send("success writing");
        }
    });
});

// Supporting CORS: https://stackoverflow.com/questions/36840396/fetch-gives-an-empty-response-body
// https://stackoverflow.com/questions/18498726/how-do-i-get-the-domain-originating-the-request-in-express-js
// Meal number denotes which specific meal you are retrieving
router.get('/get_meal/:daysAgo/:mealNumber', async function(req:any, res:any) {
    let daysAgo:number = req.params.daysAgo;
    if (daysAgo < -1) {
        res.send("Invalid day: "+daysAgo);
        return;
    }
    let mealSet = new Set<meals>();
    mealSet.add(req.params.mealNumber); // turns it into breakfast, lunch, or dinner
    if (await inArchive(daysAgo,mealSet)) {
        res.send(await readMeal(daysAgo,mealSet));
        return;
    }
    // Since summer registrations are over and the public site will be aimed at potential new students, it'll switch over in May to the next school year.
    // Before April it will probably not have switched and therefore the next year will not yet be valid.

    let menu = await JSON.parse(await getMenu(daysAgo));
    let toWrite:Food[] = await getMeals(daysAgo,mealSet,menu);
    await writeMeals(daysAgo,toWrite,mealSet);
    fs.writeFile("files/menu.json",JSON.stringify(menu),function(err:any,buf:any) {
        if(err) {
            res.send("meal not found, error writing to DB: ", err);
            return;
        } else {
        }
    });
    res.send(await readMeal(daysAgo,mealSet));
});

module.exports = router;