import { displayPartsToString, getDefaultLibFileName } from "typescript";

console.log("Hello Courses");

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

enum foodTier {
    Special = 1,
    Additional,
    Condiment
}
type Food = {    
    "id": number,
    "label": string,
    "description": string,
    "short_name": string,
    "raw_cooked": number,
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
function food_factory (id: number, name: string, calories:number, carbs: number, rote: number, phat: number, tear:foodTier, servingSize:number,servingUnits:string):Food {
    const toRet: Food = {
        id: id,
        label: name,
        description: "string",
        short_name: "string",
        raw_cooked: 1010101,
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
    return val.year+"-"+val.month.toString(2,'0').padStart()+"-"+val.day.toString().padStart(2,'0');
}
async function bonSiteUp(daysAgo:number):Promise<string> {
    // puppeteering
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    // Banner web schedule site
    await page.goto(bonSite(daysAgo), { timeout: 30000 } );

    // Inputting username/password
    await page.screenshot({path: 'files/screenshot0.png'});
    let content = await page.content();
    return content.toString();
}
async function getFoods(daysAgo:number):Promise<Food[]> {
    // puppeteering
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    // Bon site
    await page.goto(bonSite(daysAgo), { timeout: 30000 } );
    await page.screenshot({path: 'files/screenshot1.png'});

    let toRet = [];
    // Make sure to get from all meals and also from all tiers
    await getBreakfast(page, toRet);
    await getLunch(page, toRet);
    await getDinner(page, toRet);
    return toRet;
}
// Length changed because no longer at limit of course length
async function hasNext(page, oldLen) {
    // return !!(await page.$("[ng-click=\"setCurrent(pagination.current + 1)\"]"));
    // let length = await page.evaluate(() => {
    //     return (Array.from(document.querySelector('#courses').children).length);
    // });
    // return oldLen == length;
}

async function writeCourses(courses, year) {
    let filepath = "data/"+year+"/";
    let filename = year+"_courseinfo";
    let data = {};
    let courseset = {};
    for (let i = 0; i < courses.length; i++) {
        let cid = courses[i].cid;
        let cur_dept = courses[i].department;
        let cname = courses[i].cname;
        courseset[cur_dept+cid] = cur_dept; // so we can split by the prefixes

        let cur = {};
        if (cur_dept in data) {
            cur = data[cur_dept];
        }
        // update object
        cur[cid] = cname;
        // update object
        data[cur_dept] = cur;
    }

    // Lol it's like a demo of synchronous vs promises vs callbacks
    let dir_exists = fs.existsSync(filepath);
    if (!dir_exists) { // If the directory already exists
        await fs.promises.mkdir(filepath,{ recursive: true });
    }
    fs.writeFile(filepath+filename+".json", JSON.stringify(data), function(err, buf ) {
        if(err) {
            console.log("error: ", err);
        } else {
            console.log("Data saved successfully!");
        }
    });
    fs.writeFile(filepath+filename+"_courseset.json", JSON.stringify(courseset), function(err, buf ) {
        if(err) {
            console.log("error: ", err);
        } else {
            console.log("Data saved successfully!");
        }
    });
}
// TODO: Make writing a little more sophisticated
async function writeSections(sections, year) {
    let filepath = "data/"+year+"/";
    let filename = year+"_sectioninfo";
    let data = {sections};

    // Lol it's like a demo of synchronous vs promises vs callbacks
    let dir_exists = fs.existsSync(filepath);
    if (!dir_exists) { // If the directory already exists
        await fs.promises.mkdir(filepath,{ recursive: true });
    }
    fs.writeFile(filepath+filename+".json", JSON.stringify(data), function(err, buf ) {
        if(err) {
            console.log("error: ", err);
        } else {
            console.log("Data saved successfully!");
        }
    });
}

// Overview
  // This API will allow for the maintenance and use of a webscraper for Rose-Hulman's publicly available course offerings as well as specific sections for user's with credentials

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
    // There seems to be a recurring issue relating to a failure to log in.
        // It's resolved by manually logging into banner web, navigating to the schedule while logged in, and then logging out
        // Potentially also just solved by waiting
    // 2FA is a pain in the arse
        // Potential solution: We'll have a get where we send in a username, password, and phone number
        // Then we'll have a post where we send in the 2FA code
    // Error: Requesting main frame too early!
        // Seems to happen arbitrarily, just rerun

// Read
// RUN BEFORE FUTURE SCRAPING. Checks if the banner site is up/in the same format it was designed for
router.get('/scraping_up/banner/:username/:password', async function(req, res) {
    let content = await bannerSiteUp(req.params.username,req.params.password); // gets the banner site html
    let prev = await fs.promises.readFile(archivedBannerSite);
    res.send(content==prev?"banner scraping is up":"banner scraping is down. \nUsername/password may be incorrect: \nHow to encode special characters in URLs (e.g., '/' = %2F):\n https://www.w3schools.com/tags/ref_urlencode.ASP");
});
// RUN BEFORE FUTURE SCRAPING. Checks if the public site is up/in the same format it was designed for
router.get('/scraping_up/public', async function(req, res) {
    let content = await publicSiteUp(); // gets the public site html
    let prev = await fs.promises.readFile(archivedPublicSite);
    res.send(content==prev?"public scraping is up":"public scraping is down");
});
router.get('/get_classes/:year', async function(req, res) {
    let filepath = "data/"+req.params.year+"/"+req.params.year+"_courseinfo_courseset.json";
    let dir_exists = fs.existsSync(filepath);
    res.send(dir_exists?await fs.promises.readFile(filepath):"This year's courses have not been scraped yet");
});
router.get('/get_class_name/:year/:class', async function(req, res) {
    let filepath = "data/"+req.params.year+"/";
    let course_set = req.params.year+"_courseinfo_courseset.json";
    let courses = req.params.year+"_courseinfo.json";
    let dir_exists = fs.existsSync(filepath);
    if (dir_exists) {
        let depts = await JSON.parse(await fs.promises.readFile(filepath+course_set));
        let dept = depts[req.params.class]; // the corresponding dept
        let names = await JSON.parse(await fs.promises.readFile(filepath+courses));
        res.send(names[dept][req.params.class.substring(dept.length)]);
    } else {
        res.send("This year's courses have not been scraped yet");
    }
});
router.get('/get_sections/:year/:class', async function(req, res) {
    // let filepath = req.params.year+"/"+req.params.year+"_courseinfo_courseset.json";
    // let dir_exists = fs.existsSync(filepath);
    // res.send(dir_exists?await fs.promises.readFile(filepath):"This year's sections has not been scraped yet");
});

// Update
// Overwrite old_banner_site.html. Only call when sure we can process old_site.html
router.put('/update_archive/banner',async function(req,res) {
    let content = await bannerSiteUp(); // gets the banner site html
    fs.writeFile(archivedBannerSite,content,function(err, buf) {
        if(err) {
            res.send("error writing: ", err);
        } else {
            res.send("success writing");
        }
    });
});
// Overwrite old_public_site.html. Only call when sure we can process old_site.html
router.put('/update_archive/public',async function(req,res) {
    let content = await publicSiteUp(); // gets the public site html
    fs.writeFile(archivedPublicSite,content,function(err, buf) {
        if(err) {
            res.send("error writing: ", err);
        } else {
            res.send("success writing");
        }
    });
});
// Write all courses from public site into 20XX_courseinfo.json. Year specified is the later of xxxx-yyyy, aka the year the class of yyyy graduates
router.put('/load_courses/:year',async function(req,res) {
    let curYear = thisYear();
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    // Can't tell the future
    if (req.params.year > curYear+1) {
        res.send("Invalid year: "+req.params.year);
    }
    // Since summer registrations are over and the public site will be aimed at potential new students, it'll switch over in May to the next school year.
    // Before April it will probably not have switched and therefore the next year will not yet be valid.
    if ((req.params.year == curYear+1 && curMonth() < 3)) {
        res.send("Invalid month. Too early in the year for next years schedule: "+months.get(curMonth())+"\n(Correct if I'm wrong)");
    }

    // So we assume the site will switch over in May, so anything after that "current" will be next year, and we assume "prev-year" will start existing
    let year = "";
    // We know there will be a valid url for the given year
    if (req.params.year == curYear+1 || (req.params.year == curYear && curMonth() < 4)) { // Means next year and we know it's valid, so we look at the latest ("current"), or we want this year and it hasn't switched yet
        year = "current";
    } else { // So we're either looking at this year or years previous once they've been superceded by a current
        year = (req.params.year-1)+"-"+req.params.year;
    }
    // stepping through all 39 pages, will likely involve another puppeteer function to await
    let courses = await getCourses(year);
    await writeCourses(courses,req.params.year);
    res.end();
});
// Write all sections from banner site into 20XX_sectioninfo.json (depends on corresponding courseinfo.json). // Write all courses from public site into 20XX_courseinfo.json. Year specified is the later of xxxx-yyyy, aka the year the class of yyyy graduates
router.put('/load_sections/:year/:username/:password',async function(req,res) {
    let curYear = thisYear();
    // Can't tell the future
    if (req.params.year > curYear+1) {
        res.send("Invalid year: "+req.params.year);
    }
    let sections = await getSections(req.params.year,req.params.username, req.params.password);
    // Load/use the collected course info while organizing 
    await writeSections(sections,req.params.year);
    
    res.end();
});

module.exports = router;