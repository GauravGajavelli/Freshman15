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
gung.daysAndMeals = "days_and_meals";
gung.generateMeal = "generate_meal";

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
            await this.model.setDay(newDay); // get new board
            this.updateList();
            this.updateView();
            this.clearItems();
        };

        document.querySelector("#meal-select").onchange = async (event) => {
            // THE ASYNC ARROW FUNCTION IS VERY IMPORTANT; 
            let yourSelect = document.querySelector("#meal-select");
            let newMeal = yourSelect.options[ yourSelect.selectedIndex ].value; // 0,1,2
            await this.model.setMeal(newMeal); // get new board
            // this.updateList(); No need to update list and reset to breakfast with every meal select
            this.updateView();
            this.clearItems();
        };

        document.querySelector("#generate").onclick = async (event) => {
            await this.model.generateMeal();
        }

        document.querySelector("#vegetarian").onchange = async (event) => {
            this.model.toggleVegetarian();
        }
        document.querySelector("#vegan").onchange = async (event) => {
            this.model.toggleVegan();
        }
        document.querySelector("#glutenfree").onchange = async (event) => {
            this.model.toggleGlutenFree();
        }

        document.querySelector("#calories").onchange = (event) => {
            let val = document.querySelector("#calories");
            let newVal = val;
            if (val < 0) {
                newVal = 0;
            } else if (val > 10000) {
                newVal = 10000;
            }
            this.model.setCalories(newVal);
            val.value = newVal;
        }
        document.querySelector("#fat").onchange = (event) => {
            let f = document.querySelector("#fat");
            let c = document.querySelector("#carbohydrate");
            let p = document.querySelector("#protein");
            let newVal = f.value;
            if (f.value < 0) {
                newVal = 0;
            } else if ((f.value+c.value+p.value) <= 100) { // It'll complete the %
                newVal = 100-c.value-p.value;
            } else if ((f.value+c.value+p.value) > 100) { // It'll destroy the others lel
                p.value = 0;
                c.value = 0;
            }
            this.model.setFat(newVal);
            val.value = newVal;
        }
        document.querySelector("#carbohydrate").onchange = (event) => {
            let f = document.querySelector("#fat");
            let c = document.querySelector("#carbohydrate");
            let p = document.querySelector("#protein");
            let newVal = c.value;
            if (c.value < 0) {
                newVal = 0;
            } else if ((f.value+c.value+p.value) <= 100) { // It'll complete the %
                newVal = 100-f.value-p.value;
            } else if ((f.value+c.value+p.value) > 100) { // It'll destroy the others lel
                f.value = 0;
                p.value = 0;
            }
            this.model.setCarbohydrate(newVal);
            val.value = newVal;
        }
        document.querySelector("#protein").onchange = (event) => {
            let f = document.querySelector("#fat");
            let c = document.querySelector("#carbohydrate");
            let p = document.querySelector("#protein");
            let newVal = p.value;
            if (c.value < 0) {
                newVal = 0;
            } else if ((f.value+c.value+p.value) <= 100) { // It'll complete the %
                newVal = 100-f.value-c.value;
            } else if ((f.value+c.value+p.value) > 100) { // It'll destroy the others lel
                f.value = 0;
                c.value = 0;
            }
            this.model.setProtein(newVal);
            val.value = newVal;
        }
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
    clearItems() {
        const oldBans = document.querySelector(`#banned`);
        const oldReqs = document.querySelector(`#required`);
        oldBans.innerHTML='';
        oldReqs.innerHTML='';
        const reqHeader = gung.htmlToElement(`<h3>Required Foods</h3>`);
        const banHeader = gung.htmlToElement(`<h3>Banned Foods</h3>`);
		oldReqs.append(reqHeader);
        oldBans.append(banHeader);
    }
    updateList() {
            const bOption = gung.htmlToElement(`<option value="0">Breakfast</option>`);
            const lOption = gung.htmlToElement(`<option value="1">Lunch</option>`);
            const dOption = gung.htmlToElement(`<option value="2">Dinner</option>`);
        let options = [bOption,lOption,dOption];
        let mealSelect = document.querySelector(`#meal-select`);
        let meals = this.model.getValidMeals();
        let mealnames = this.model.getMealNames();
        for (let i = 0; i <= 2; i++) {
            let curOption = document.querySelector(`#meal-select option[value='${i}']`);
            if (curOption) { // if it is had
                curOption.parentElement.removeChild(curOption);
            }
            if (meals[mealnames[i]]) { // if it should be had
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
            <div class="flex-item ${fs.food["nutritionless"]?"nutritionless":""}" id="f${fs.food["id"]}"><h1>${fs.food["label"]}</h1>
            <button>
              Add Back
            </button>
            </div>
            `);
        } else if (fs.required) {
            return gung.htmlToElement(`
            <div class="flex-item ${fs.food["nutritionless"]?"nutritionless":""}" id="f${fs.food["id"]}"><h1>${fs.food["label"]}</h1>
            <span>
              <span>
                <input type="number" id="quantity" min="1" max="10" value="${fs.quantity == 0?1:fs.quantity}"/>
              </span>
              <button>
                Remove
              </button>
            </span>
            </div>
            `);
        } else {
            return gung.htmlToElement(`
            <div class="flex-item ${fs.food["nutritionless"]?"nutritionless":""}" id="f${fs.food["id"]}"><h1>${fs.food["label"]}</h1>
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
            square.children[1].children[0].children[0].onchange = (event) => {
                let val = square.children[1].children[0].children[0].value;
                let newVal = val;
                if (val < 1) {
                    newVal = 1;
                } else if (val > 10) {
                    newVal = 10;
                }
                // Change to id later
                let foodID = square.id;
                this.model.setFoodFreq(foodID,newVal);
                square.children[1].children[0].children[0].value = newVal;
            }
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
    constructor(dayta) {
        this.loading = false;
		// TODO: Make instance variables
        this.curDay = 0; // Default: today. It's fine with invalid values, just displays text indicating as such TODO REVERT TO 0
        this.curMeal = 0;

        this.data = dayta; // gets the object
        this.board = {};
        this.meals = ["breakfast", "lunch", "dinner"];
        let foods = this.data.meals[this.curDay.toString()][this.meals[this.curMeal]];
		for (const property in foods) {
			this.board["f"+foods[property]["id"]] = new gung.FoodSquare(foods[property]);
		}

        // Dietary preference
        this.vegetarian = false;
        this.vegan = false;
        this.glutenfree = false;

        // Parameters
        this.calories = 750;
        this.fat = 25;
        this.carb = 55;
        this.protein = 20;
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
        let data = {};
        try {
            data = await fetch("http://"+gung.apiUrl+"/"+gung.daysAndMeals+"/0", { // Always /0, to get days surrounding
                // mode: 'no-cors',
                method: 'GET',
                headers: {
                        "Content-Type": "application/json"
                }
            });
        } catch(err) {
            alert(err); // Failed to fetch
        }
        return new gung.Model(await data.json());
    }
    setController(ctrlr) {
        this.controller = ctrlr;
    }
    setFoodFreq(id,freq) {
        this.board[id].quantity = freq;
        console.log("There are now "+freq+" "+this.board[id].food["label"]);
    }
    setCalories(cals) {
        this.calories = cals;
    }
    setFat(f) {
        this.fat = f;
    }
    setCarbohydrate(c) {
        this.carb = c;
    }
    setProtein(p) {
        this.protein = p;
    }
    toggleVegetarian(){
        this.vegetarian = !this.vegetarian;
        // console.log("vegetarian: "+this.vegetarian);
    }
    toggleVegan(){
        this.vegan = !this.vegan;
        // console.log("vegan: "+this.vegan);
    }
    toggleGlutenFree(){
        this.glutenfree = !this.glutenfree;
        // console.log("glutenfree: "+this.glutenfree);
    }
    getBoard() {
        return this.board;
    }
    getMealNames() {
        return this.meals;
    }
    getValidMeals() {
        return this.data.validMeals[this.curDay.toString()];
    }
    getValidDays() {
        return this.data.validMenus;
    }
    async setDay(day) {
        this.curDay = day;
        await(this.setMeal(0));
    }
    async setMeal(meal) {
        this.curMeal = meal;
        let foods = this.data.meals[this.curDay.toString()][this.meals[this.curMeal]];
        this.board = {};
		for (const property in foods) {
			this.board["f"+foods[property]["id"]] = new gung.FoodSquare(foods[property]);
		}
    }
    async generateMeal() {
        const resp = await fetch(`http://${gung.apiUrl}/${gung.generateMeal}/${this.vegetarian}/${this.vegan}/${this.glutenfree}/${this.calories}/${this.fat}/${this.carb}/${this.protein}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.board)
        });
        const content = await resp.json();

        console.log(content);
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