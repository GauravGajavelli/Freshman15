    // ScrapingService
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
// ScrapingService
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
// ScrapingService
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
// ScrapingService
// Pass in a page with a valid menu
// ASSUMPTION: the idea of getting the menu from days ago (and this does matter, as the IDs shift), hinges on them having giving us consistent menu IDs within each day's site
// Returns an object with the menu with strings from the site daysAgo number of days ago
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
// ScrapingService
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
// ScrapingService
// Returns if DB/file storage for having the value
async function inDatabase(daysAgo:number):Promise<boolean> {
    let filepath = "files/";
    let filename = formattedDate(daysAgo)+"_dayinfo";
    return fs.existsSync(filepath+filename+".json");
}
// ScrapingService
// Only call if the meal is in the archive
async function outDatabase(daysAgo:number):Promise<any> {
    let filepath = "files/";
    let filename = formattedDate(daysAgo)+"_dayinfo";
    return await JSON.parse(await fs.promises.readFile(filepath+filename+".json"));
}
// ScrapingService
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
