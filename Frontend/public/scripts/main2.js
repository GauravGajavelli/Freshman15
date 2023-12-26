// Refactor to minimize backend calls if caching doesn't speed up enough

// When adding new stuff
    // 1. add it to the model first (prolly uses backend connectivity)
    // 2. then add to the view (since you need to interface with the model)

/** jquery */
// var script = document.createElement('script');
// script.src = 'https://code.jquery.com/jquery-3.6.3.min.js'; // Check https://jquery.com/ for the current version
// document.getElementsByTagName('head')[0].appendChild(script);
// console.log(script);

/** namespace. */
var gung = gung || {};

/** globals */
gung.variableName = "";
gung.apiUrl = "localhost:3000";
gung.mealPath = "get_meal";
gung.dayCheck = "check_day";
gung.mealCheck = "check_meal";

/** function and class syntax examples */
gung.functionName = function () {
	/** function body */
};

gung.htmlToElement = function(html) {
	var template = document.createElement("template");
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

gung.FoodSquare = class {
    constructor(foodo) {
        this.food = foodo;
        this.required = false;
        this.banned = false;
        this.quantity = 0;
    }
}

// Controller
    // Updates the view/model
    // Is updated by the model/view
    // Will have the click listeners
gung.FoodController = class {
	constructor(modelo) {
        this.model = modelo;
        // const foods = document.querySelectorAll("#foods .flex-item");
		// for (const food of foods) {
		// 	food.onclick = (event) => {
		// 		const buttonIndex = parseInt(square.dataset.buttonIndex);
		// 		// console.log("buttonIndex", buttonIndex);
		// 		// console.log(typeof(buttonIndex));
		// 		this.game.pressedButtonAtIndex(buttonIndex);
		// 		this.updateView();
		// 	};
		// }
        // const dates = document.querySelectorAll(`#date-select option`);
        document.querySelector("#date-select").onchange = async (event) => {
            // THE ASYNC ARROW FUNCTION IS VERY IMPORTANT; 
            let yourSelect = document.querySelector("#date-select");
            let newDay = yourSelect.options[ yourSelect.selectedIndex ].value; // -1,0,1
            console.log("Nude, ay: "+newDay);
            await this.model.setDay(newDay); // get new board
            this.updateList();
            this.updateView();
        };

        document.querySelector("#meal-select").onchange = async (event) => {
            // THE ASYNC ARROW FUNCTION IS VERY IMPORTANT; 
            let yourSelect = document.querySelector("#meal-select");
            let newMeal = yourSelect.options[ yourSelect.selectedIndex ].value; // -1,0,1
            console.log("Nume, eel: "+newMeal);
            await this.model.setMeal(newMeal); // get new board
            this.updateList();
            this.updateView();
        };
        this.updateList();
        this.updateView();
	}
    static async makeController() {
        const model = await gung.Model.fetchModel();
        // Invoke the private constructor...
        let ctrlr = new gung.FoodController(model);
        model.setController(ctrlr); // To enable two way communication
        return ctrlr;
    }
    updateView() {
        this.updateBoard();
    }
    updateList() {
        console.log("Updating list");
            const bOption = gung.htmlToElement(`<option value="0">Breakfast</option>`);
            const lOption = gung.htmlToElement(`<option value="1">Lunch</option>`);
            const dOption = gung.htmlToElement(`<option value="2">Dinner</option>`);
        let options = [bOption,lOption,dOption];
        let mealSelect = document.querySelector(`#meal-select`);
        let meals = this.model.getCurrentMeals();
        console.log("Sheck it out, meals: "+meals);
        for (let i = 0; i <= 2; i++) {
            let curOption = document.querySelector(`#meal-select option[value='${i}']`);
            if (curOption) { // if it is had
                curOption.parentElement.removeChild(curOption);
            }
            if (meals.has(i)) { // if it should be had
                console.log("Made visible: "+i);
                mealSelect.append(options[i]);
            }
        }
    }
    updateBoard() {
        console.log("Updating view");
        // const food = document.querySelector("#fuwafuwa");
		// food.innerHTML = this.model.foods;
        const newBoard = gung.htmlToElement('<div class="flex-container" id="foods"></div>');
        let board = this.model.getBoard();
        for (const property in board) {
            const fS = board[property]; // foodSquare
            if (fS.food["tier"] == 0 || fS.food["tier"] == 2) {
                // const mq = rhit.fbCalendarManager.getCalendarAtIndex(i);
                const newSquare = this._createSquare(fS);
                // const newCard = this._createCard(mq);
                this._setUpClick(newSquare,fS);
                newBoard.appendChild(newSquare);
                // newList.appendChild(newCard);
            }
        }
        const oldBoard = document.querySelector("#foods");
		// const oldList = document.querySelector("#mainCalendarPage");
        oldBoard.removeAttribute("id");
		// oldList.removeAttribute("id");
        oldBoard.hidden = true;
		// oldList.hidden = true;
        oldBoard.parentElement.prepend(newBoard);
        oldBoard.parentElement.removeChild(oldBoard);
		// oldList.parentElement.appendChild(newList);
    }
    _createSquare(fs) {
        if (fs.banned) {
            return gung.htmlToElement(`
            <div class="flex-item ${fs.food["nutritionless"]?"nutritionless":""}"><h1>${fs.food["label"]}</h1>
            <button>
              Add Back
            </button>
            </div>
            `);
        } else if (fs.required) {
            return gung.htmlToElement(`
            <div class="flex-item ${fs.food["nutritionless"]?"nutritionless":""}"><h1>${fs.food["label"]}</h1>
            <span>
              <span>
                <input type="number" id="quantity" min="1" value="1"/>
              </span>
              <button>
                Remove
              </button>
            </span>
            </div>
            `);
        } else {
            return gung.htmlToElement(`
            <div class="flex-item ${fs.food["nutritionless"]?"nutritionless":""}"><h1>${fs.food["label"]}</h1>
            <button>
              Add
            </button>
            <button>
              Remove
            </button>
            </div>
            `);
        }
    }
    _createItem(fs) { // Creates a list item, based on the list type
        if (fs.banned) {
            return gung.htmlToElement(`
            <div id="f${fs.food["id"]}" class="removed flex-container5">
            <span>${fs.food["label"]}</span>
            <button>X</button>
            </div>
            `);
        } else if (fs.required) {
            return gung.htmlToElement(`
            <div id="f${fs.food["id"]}" class="added flex-container5">
            <span>${fs.food["label"]}</span>
            <button>X</button>
            </div>
            `);
        } else { // neither banned nor required: a final meal item
            return gung.htmlToElement(`
            <div id="f${fs.food["id"]}" class="flex-container5">
            <span>${fs.food["label"]}</span>
            <button>X</button>
            </div>
            `);
        }
    }
    _setUpClick(square,fs) {
        if (fs.banned) {
            // return gung.htmlToElement(`
            // <div class="flex-item"><h1>${fs.food["label"]}</h1>
            // <button>
            //   Add Back
            // </button>
            // </div>
            // `);
            square.children[1].onclick = (event) => {
                // Prolly need to do some model stuff
                // this.game.pressedButtonAtIndex(buttonIndex);
                fs.banned = false;
                    const oldBans = document.querySelector("#banned");
                    const item = document.querySelector(`#banned #f${fs.food["id"]}`);
                    oldBans.removeChild(item);
                this.updateView();
            };
        } else if (fs.required) {
            // return gung.htmlToElement(`
            // <div class="flex-item"><h1>${fs.food["label"]}</h1>
            // <span>
            //   <span>
            //     <input type="number" id="quantity" min="1" value="${fs.quantity}"/>
            //   </span>
            //   <button>
            //     Remove
            //   </button>
            // </span>
            // </div>
            // `);
            square.children[1].children[1].onclick = (event) => {
                // Prolly need to do some model stuff
                // this.game.pressedButtonAtIndex(buttonIndex);
                fs.required = false;
                    const oldReqs = document.querySelector("#required");
                    const item = document.querySelector(`#required #f${fs.food["id"]}`);
                    oldReqs.removeChild(item);
                this.updateView();
            };
            // TODO Set up click stuff
        } else { // neither banned nor required
            // return gung.htmlToElement(`
            // <div class="flex-item"><h1>${fs.food["label"]}</h1>
            // <button>
            //   Add
            // </button>
            // <button>
            //   Remove
            // </button>
            // </div>
            // `);
            square.children[1].onclick = (event) => {
                // Prolly need to do some model stuff
                // this.game.pressedButtonAtIndex(buttonIndex);
                fs.required = true;
                    const oldReqs = document.querySelector("#required");
                    const newReq = this._createItem(fs);
                    this._setUpDelete(newReq,fs);
                    oldReqs.append(newReq);
                this.updateView();
            };
            square.children[2].onclick = (event) => {
                // Prolly need to do some model stuff
                // this.game.pressedButtonAtIndex(buttonIndex);
                fs.banned = true;
                    const oldBans = document.querySelector("#banned");
                    const newBan = this._createItem(fs);
                    this._setUpDelete(newBan,fs);
                    oldBans.append(newBan);
                this.updateView();
            };
        }
    }
    _setUpDelete(item,fs) { // adds a delete click listener for a list item
        item.children[1].onclick = (event) => {
            console.log("tried to delete");
            // Prolly need to do some model stuff
            // this.game.pressedButtonAtIndex(buttonIndex);
            const oldList = document.querySelector(`#${fs.banned?"banned":"required"}`); // Assumes banned if not required because in list
            if (fs.banned) {
                fs.banned = false;
            } else if (fs.required) {
                fs.required = false;
            }
            oldList.removeChild(item);
            this.updateView();
        };
    }
}

// Model
    // Talks to the backend to save/load data
gung.Model = class {
    constructor(foodo,dias,milos) {
        this.loading = false;
		// TODO: Make instance variables
        this.curDay = 0; // Defeault: today. It's fine with invalid values, just displays text indicating as such TODO REVERT TO 0
        this.curMeal = 0;
        this.validDays = dias;
        this.validMeals = milos; // It's not fine with invalid values, since the meals may not actually exist, unlike days

        this.foods = foodo; // gets the object
        this.board = {};
		for (const property in this.foods) {
			this.board[this.foods[property]["label"]] = new gung.FoodSquare(this.foods[property]);
            // console.log("Own kung: "+this.foods[property]);
            // console.log(new gung.FoodSquare());
		}
		// console.log('this.board = ', this.board);
		// console.log('this.state :>> ', this.state);
    }

    static async booleanVal(response) {
        return (JSON.stringify(await response.json())) === 'true';
    }

    static async mealsForDay(day) {
        let meals = new Set();
        for (let m = 0; m <= 2; m++) { // meals
            let validMeal = false;
            try {
                validMeal = await fetch(`http://${gung.apiUrl}/${gung.mealCheck}/${day}/${m}`, {
                    // mode: 'no-cors',
                    method: 'GET',
                    headers: {
                            "Content-Type": "application/json"
                    }
                });
            } catch(err) {
                alert(err); // Failed to fetch
            }
            let valMel = (await gung.Model.booleanVal(validMeal));
            console.log("Valid meal?: "+valMel);
            if (valMel) {
                meals.add(m);
            }
        }
        return meals;
    }

    /**
     * This static factory function now serves as
     * the user-facing constructor for this class.
     * It indirectly invokes the `constructor` in
     * the end, which allows us to leverage the
     * `async`-`await` syntax before finally passing
     * in the "ready" data to the `constructor`.
     */
    // https://dev.to/somedood/the-proper-way-to-write-async-constructors-in-javascript-1o8c
    static async fetchModel() {
        // Perform `async` stuff here...
        let days = new Set(); // set of the available days
        let meals = new Map(); // maps days to what meals are available, for when they get future options
        for (let i = 0; i <= 2; i++) { // days
            let ds = [0,3,4];
            let d = ds[i];
            let validDay = false;
            try {
                validDay = await fetch(`http://${gung.apiUrl}/${gung.dayCheck}/${d}`, {
                    // mode: 'no-cors',
                    method: 'GET',
                    headers: {
                            "Content-Type": "application/json"
                    }
                });
            } catch(err) {
                alert(err); // Failed to fetch
            }
            meals.set(d,new Set());
            let valdy = (await gung.Model.booleanVal(validDay));
            console.log("Valid day?: "+valdy);
            if (valdy) {
                days.add(d);
                meals.set(d, await gung.Model.mealsForDay(d));
            }
        }
        let meal = {};
        if (meals.get(0).has(0)) { // breakfast was a valid meal
            try {
                meal = await fetch("http://"+gung.apiUrl+"/"+gung.mealPath+"/0/0", {
                    // mode: 'no-cors',
                    method: 'GET',
                    headers: {
                            "Content-Type": "application/json"
                    }
                });
            } catch(err) {
                alert(err); // Failed to fetch
            }
            return new gung.Model(await meal.json(),days,meals);
        } else {
            alert("There is no breakfast today");
            return new gung.Model({},days,meals);
        }
    }
    getBoard() {
        return this.board;
    }
    getCurrentMeals() {
        let arr = Array.from( this.validMeals.keys() );
        let gurget = new Set();
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == this.curDay) {
                console.log("glottal match, but real match: "+(arr[i] === this.curDay));
                gurget = this.validMeals.get(arr[i]);
            }else{
                console.log("glottal not match, but real match: "+(arr[i] === this.curDay));
            }
        }
        return gurget;
    }
    getValidDays() {
        return this.validDays;
    }
    async setDay(day) {
        this.curDay = day;
        await(this.setMeal(0));
    }
    async setMeal(meal) {
        this.curMeal = meal;
        console.log("cur day: "+this.curDay+", cur meal: "+this.curMeal);
        console.log("curray: "+this.validMeals.get(this.curDay));
        let arr = Array.from( this.validMeals.keys() );
        let gurget = new Set();
        for (let i = 0; i < arr.length; i++) {
            console.log("# 2 Key val: "+arr[i]);
            console.log("# 2 Key val val: "+this.validMeals.get(arr[i]));
            let arr2 = Array.from(this.validMeals.get(arr[i]));
            for (let j = 0; j < arr2.length; j++) {
                console.log("# 2 curray val: "+arr2[j]);
            }
            if (arr[i] == this.curDay) {
                console.log("match");
                gurget = this.validMeals.get(arr[i]);
            }else{
                console.log("not match");
            }
        }
        console.log("new gurget curray?: "+gurget);
        if (gurget.has(this.curMeal)) { // breakfast was a valid meal
            try {
                meal = await fetch(`http://${gung.apiUrl}/${gung.mealPath}/${this.curDay}/${this.curMeal}`, {
                    // mode: 'no-cors',
                    method: 'GET',
                    headers: {
                            "Content-Type": "application/json"
                    }
                });
            } catch(err) {
                alert(err); // Failed to fetch
            }
        } else {
            let mealstrs = ["breakfast", "lunch", "dinner"];
            alert(`There is no ${mealstrs[this.curMeal]} today`);
        }
        console.log("MILO: "+meal);
        if (meal) {
            this.foods = await meal.json();
        } else {
            this.foods = {};
        }
        this.board = {};
		for (const property in this.foods) {
			this.board[this.foods[property]["label"]] = new gung.FoodSquare(this.foods[property]);
            // console.log("Own kung: "+this.foods[property]);
            // console.log(new gung.FoodSquare());
		}
    }
}

gung.initializePage = async function () {
	if (document.querySelector("#mainPage")) {
		await gung.FoodController.makeController();
	}
}

// /* Main */
// /** function and class syntax examples */
gung.main = function () {
    gung.initializePage(function(err, buf) {
        if(err) {
            res.send("error initializing page");
        } else {
            res.send("success initializing page");
        }
    });
};

gung.main();