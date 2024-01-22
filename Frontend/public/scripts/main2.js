// TODO
    // Implement dietary preference filtering (vegetarian means we only show vegetarian foods, etc.)
    // Implement cases for when there just is no feasible meal with the given requirements
    // Implement input cleaning for numbers
    // (Resolved, see implement hover nutrition) Implement running requirements nutrition and final output nutrition locations

// Refactor to minimize backend calls if caching doesn't speed up enough

// When adding new stuff
    // 1. add it to the model first (prolly uses backend connectivity)
    // 2. then add to the view (since you need to interface with the model)

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
        this.quantity = 1;
    }
}

// Controller
    // Updates the view/model
    // Is updated by the model/view
    // Will have the click listeners
gung.FoodController = class {
	constructor(modelo,firstmeal) {
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
            await this.model.generateMeal();
        };

        document.querySelector("#meal-select").onchange = async (event) => {
            // THE ASYNC ARROW FUNCTION IS VERY IMPORTANT; 
            let yourSelect = document.querySelector("#meal-select");
            let newMeal = yourSelect.options[ yourSelect.selectedIndex ].value; // 0,1,2
            await this.model.setMeal(newMeal); // get new board
            // this.updateList(); No need to update list and reset to breakfast with every meal select
            this.updateView();
            this.clearItems();
            await this.model.generateMeal();
        };

        document.querySelector("#generate").onclick = async (event) => {
            await this.model.generateMeal();
        }
        document.querySelector("#required").onclick = async (event) => {
            let nutrition = this.model.getRequiredNutrition();
            this._showNutrition(nutrition,"Required Foods");
        }
        document.querySelector("#banned").onclick = async (event) => {
            let nutrition = this.model.getBannedNutrition();
            this._showNutrition(nutrition,"Banned Foods");
        }
        document.querySelector("#plan").onclick = async (event) => {
            let nutrition = this.model.getPlannedNutrition();
            this._showNutrition(nutrition, "Planned Meal");
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

        document.querySelector("#calories").onchange = async (event) => {
            let val = document.querySelector("#calories");
            let newVal = val.value;
            // if (val < 0) {
            //     newVal = 0;
            // } else if (val > 10000) {
            //     newVal = 10000;
            // }
            // val.value = newVal;
            this.model.setCalories(newVal);
            await this.model.generateMeal();
        }
        document.querySelector("#fat").onchange = async (event) => {
            let f = document.querySelector("#fat");
            let c = document.querySelector("#carbohydrate");
            let p = document.querySelector("#protein");
            let newVal = f.value;
            // if (f.value < 0) {
            //     newVal = 0;
            // } else if ((f.value+c.value+p.value) <= 100) { // It'll complete the %
            //     newVal = 100-c.value-p.value;
            // } else if ((f.value+c.value+p.value) > 100) { // It'll destroy the others lel
            //     p.value = 0;
            //     c.value = 0;
            // }
            // val.value = newVal;
            this.model.setFat(newVal);
            await this.model.generateMeal();
        }
        document.querySelector("#carbohydrate").onchange = async (event) => {
            // let f = document.querySelector("#fat");
            // let c = document.querySelector("#carbohydrate");
            // let p = document.querySelector("#protein");
            let newVal = c.value;
            // if (c.value < 0) {
            //     newVal = 0;
            // } else if ((f.value+c.value+p.value) <= 100) { // It'll complete the %
            //     newVal = 100-f.value-p.value;
            // } else if ((f.value+c.value+p.value) > 100) { // It'll destroy the others lel
            //     f.value = 0;
            //     p.value = 0;
            // }
            // val.value = newVal;
            this.model.setCarbohydrate(newVal);
            await this.model.generateMeal();
        }
        document.querySelector("#protein").onchange = async (event) => {
            // let f = document.querySelector("#fat");
            // let c = document.querySelector("#carbohydrate");
            // let p = document.querySelector("#protein");
            let newVal = p.value;
            // if (c.value < 0) {
            //     newVal = 0;
            // } else if ((f.value+c.value+p.value) <= 100) { // It'll complete the %
            //     newVal = 100-f.value-c.value;
            // } else if ((f.value+c.value+p.value) > 100) { // It'll destroy the others lel
            //     f.value = 0;
            //     c.value = 0;
            // }
            // val.value = newVal;
            this.model.setProtein(newVal);
            await this.model.generateMeal();
        }
        document.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await this.model.generateMeal();
            }
        });
        this.updateChart(firstmeal);
        this.setPlan(firstmeal);
        this.updateList();
        this.updateView();
	}
    static async makeController() {
        const model = await gung.Model.fetchModel();
        let firstMeal = await model.generateMeal();
        // Invoke the private constructor...
        let ctrlr = new gung.FoodController(model,firstMeal);
        model.setController(ctrlr); // To enable two way communication
        return ctrlr;
    }
    updateView() { // I guess this should also add the modal listeners for the lists
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
        this.clearPlan();
    }
    clearPlan() {
        const oldPlan = document.querySelector(`#plan`);
        oldPlan.innerHTML='';
        const planHeader = gung.htmlToElement(`<h3>Planned Meal</h3>`);
		oldPlan.append(planHeader);
    }
    updateList() {
        let mealSelect = document.querySelector(`#meal-select`);
        let meals = this.model.getValidMeals();
        let mealnames = this.model.getMealNames();
        let options = this.makeOptions(mealnames);
        for (let i = 0; i < mealnames.length; i++) {
            let curOption = document.querySelector(`#meal-select option[value='${i}']`);
            if (curOption) { // if it is had
                curOption.parentElement.removeChild(curOption); // always remove
            }
            if (meals[mealnames[i]]) { // if it should be had
                mealSelect.append(options[i]);
            }
        }
    }
    makeOptions(mealnames) {
        let toRet = [];
        for (let i = 0; i < mealnames.length; i++) {
            let word = mealnames[i];
            toRet.push(
                gung.htmlToElement(`<option value="${i}">${word.charAt(0).toUpperCase()+word.slice(1)}</option>`
                )
            );
        }
        return toRet;
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
    updateChart(plannedMeal) {
        let f = 0;
        let c = 0;
        let p = 0;
        for (let i = 0; i < plannedMeal.length; i++) {
            const cur = plannedMeal[i].food;
            const qty = plannedMeal[i].quantity;
            f += qty*(parseInt(cur["nutrition_details"]["fatContent"]["value"])?parseInt(cur["nutrition_details"]["fatContent"]["value"]):10)*9;
            c += qty*(parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"])?parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"]):10)*4;
            p += qty*(parseInt(cur["nutrition_details"]["proteinContent"]["value"])?parseInt(cur["nutrition_details"]["proteinContent"]["value"]):10)*4;
        }
        let totalCals = f+c+p;
        let normalizedFatCals = totalCals? (f*100)/totalCals:0;
        let normalizedCarbohydrateCals = totalCals?(c*100)/totalCals:0;
        let normalizedProteinCals = totalCals? (p*100)/totalCals:0;

        // console.log("f: "+normalizedFatCals);
        // console.log("c: "+normalizedCarbohydrateCals);
        // console.log("p: "+normalizedProteinCals);
        
        const xValues = ["Fat", "Protein", "Carbohydrates"];
        const yValues = [normalizedFatCals, normalizedProteinCals, normalizedCarbohydrateCals];
        const barColors = [
            "#ffe101",
            "#f95811",
            "#00ff00"
        ];
        if (!this.chart) {
            const ctx = document.getElementById('ratios');
            this.chart = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: xValues,
                    datasets: [{
                        backgroundColor: barColors,
                        data: yValues
                    }]
                },
                options: {
                    interaction: {
                        intersect:true
                    }
                }
            });
        } else {
            this.chart.type = "doughnut";
            this.chart.data = {
                    labels: xValues,
                    datasets: [{
                        backgroundColor: barColors,
                        data: yValues
                    }]
            };
            this.chart.options = {
                    interaction: {
                        intersect:true
                    }
            };
            this.chart.update();
        }
    }
    // Creates all of the items for the plan
    setPlan(plannedMeal) {
        // plannedMeal is an array of FoodSquares representing meal items
        this.clearPlan();
        this.updateChart(plannedMeal);
        for (let i = 0; i < plannedMeal.length; i++) {
            const fs = plannedMeal[i];
            const oldPlan = document.querySelector("#plan");
            const newPlan = this._createItem(fs);
            this._setUpPopup(newPlan,fs);
            oldPlan.append(newPlan);
        }
    }
    _createSquare(fs) {
        if (fs.banned) {
            return gung.htmlToElement(`
            <div class="flex-item ${fs.food["nutritionless"]?"nutritionless":""} ${fs.food["artificial_nutrition"]?"artificial_nutrition":""}" id="f${fs.food["id"]}"><h1>${fs.food["label"]}</h1>
            <button>
              Add Back
            </button>
            </div>
            `);
        } else if (fs.required) {
            return gung.htmlToElement(`
            <div class="flex-item ${fs.food["nutritionless"]?"nutritionless":""} ${fs.food["artificial_nutrition"]?"artificial_nutrition":""}" id="f${fs.food["id"]}"><h1>${fs.food["label"]}</h1>
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
            <div class="flex-item ${fs.food["nutritionless"]?"nutritionless":""} ${fs.food["artificial_nutrition"]?"artificial_nutrition":""}" id="f${fs.food["id"]}"><h1>${fs.food["label"]}</h1>
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
            let perServing = parseFloat(!fs.food.nutritionless?fs.food["nutrition_details"]["servingSize"]["value"]:"1");
            let units = !fs.food.nutritionless?fs.food["nutrition_details"]["servingSize"]["unit"]:"units";
            // console.log(Object.entries(fs));
            return gung.htmlToElement(`
            <div id="f${fs.food["id"]}" class="${fs.food.artificial_nutrition?"artificial":""} flex-container5">
            <span>${fs.food["label"]}</span>
            <button>${this.roundNum(/*fs.quantity* */perServing)} ${units} x ${fs.quantity}</button>
            </div>
            `);
        }
    }
    // Rounds to nearest 10th
    roundNum(num) {
        return Math.round(num * 10) / 10;
    }
    // TODO; If stopPropagation causes problems in the future: https://css-tricks.com/dangers-stopping-event-propagation/
    _setUpClick(square,fs) {
        if (fs.banned) {
            // return gung.htmlToElement(`
            // <div class="flex-item"><h1>${fs.food["label"]}</h1>
            // <button>
            //   Add Back
            // </button>
            // </div>
            // `);
            square.children[1].onclick = async (event) => {
                // Prolly need to do some model stuff
                // this.game.pressedButtonAtIndex(buttonIndex);
                event.stopPropagation();
                fs.banned = false;
                    const oldBans = document.querySelector("#banned");
                    const item = document.querySelector(`#banned #f${fs.food["id"]}`);
                    oldBans.removeChild(item);
                this.updateView();
                await this.model.generateMeal();
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
            square.children[1].children[1].onclick = async (event) => {
                // Prolly need to do some model stuff
                // this.game.pressedButtonAtIndex(buttonIndex);
                event.stopPropagation();
                fs.required = false;
                    const oldReqs = document.querySelector("#required");
                    const item = document.querySelector(`#required #f${fs.food["id"]}`);
                    oldReqs.removeChild(item);
                this.updateView();
                await this.model.generateMeal();
            };
            square.children[1].children[0].children[0].onclick = async (event) => {
                event.stopPropagation();
            }
            square.children[1].children[0].children[0].onchange = async (event) => {
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
                await this.model.generateMeal();
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
            square.children[1].onclick = async (event) => {
                // Prolly need to do some model stuff
                // this.game.pressedButtonAtIndex(buttonIndex);
                event.stopPropagation();
                fs.required = true;
                    const oldReqs = document.querySelector("#required");
                    const newReq = this._createItem(fs);
                    this._setUpDelete(newReq,fs);
                    oldReqs.append(newReq);
                this.updateView();
                await this.model.generateMeal();
            };
            square.children[2].onclick = async (event) => {
                // Prolly need to do some model stuff
                // this.game.pressedButtonAtIndex(buttonIndex);
                event.stopPropagation();
                fs.banned = true;
                    const oldBans = document.querySelector("#banned");
                    const newBan = this._createItem(fs);
                    this._setUpDelete(newBan,fs);
                    oldBans.append(newBan);
                this.updateView();
                await this.model.generateMeal();
            };
        }
        square.onclick = (event) => {
            let food = fs.food.nutrition_details;
            let nutrition = [food.calories.value,
                food.fatContent.value,
                food.carbohydrateContent.value,
                food.proteinContent.value]; // k, f, c, p
            this._showNutrition(nutrition, fs.food.label);
        }
    }
    _setUpDelete(item,fs) { // adds a delete click listener for a list item
        item.children[1].onclick = async (event) => {
            event.stopPropagation();
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
            await this.model.generateMeal();
        };
    }
    _setUpPopup(item,fs) { // adds a popup click listener for a list item
        item.children[1].onclick = (event) => {
            event.stopPropagation();
            let food = fs.food.nutrition_details;
            let qty = fs.quantity;
            let nutrition = [qty*food.calories.value,
                qty*food.fatContent.value,
                qty*food.carbohydrateContent.value,
                qty*food.proteinContent.value]; // k, f, c, p
            this._showNutrition(nutrition, fs.food.label+(fs.quantity==1?"":" x "+fs.quantity));
        };
    }
    // Apparently you can query select for these by doing id.innerText, slick
    _showNutrition(nutrition, name) {
        document.querySelector("#name").innerText = name;
        modalk.innerText = nutrition[0];
        modalf.innerText = nutrition[1];
        modalc.innerText = nutrition[2];
        modalp.innerText = nutrition[3];
        
        favDialog.showModal();
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
        let day = this.data.meals[this.curDay.toString()];
        let foods = day[Object.keys(day)[this.curMeal]];
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

        this.plannedMeal = [];
        this.bannedMeal = {};
        this.requiredMeal = {};
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
        console.log("vegetarian: "+this.vegetarian);
    }
    toggleVegan(){
        this.vegan = !this.vegan;
        console.log("vegan: "+this.vegan);
    }
    toggleGlutenFree(){
        this.glutenfree = !this.glutenfree;
        console.log("glutenfree: "+this.glutenfree);
    }
    getBoard() {
        return this.board;
    }
    getMealNames() {
        return Object.keys(this.data.validMeals[this.curDay.toString()]);
    }
    getValidMeals() {
        return this.data.validMeals[this.curDay.toString()];
    }
    getValidDays() {
        return this.data.validMenus;
    }
    setDay(day) {
        this.curDay = day;
        this.setMeal(0);
    }
    setMeal(meal) {
        this.curMeal = meal;
        let day = this.data.meals[this.curDay.toString()];
        let foods = day[Object.keys(day)[this.curMeal]];
        this.board = {};
		for (const property in foods) {
			this.board["f"+foods[property]["id"]] = new gung.FoodSquare(foods[property]);
		}
    }
    getBannedNutrition() {
        let k = 0;
        let f = 0;
        let c = 0;
        let p = 0;
        for (const property in this.board) {
            const fS = this.board[property]; // foodSquare
            if (fS.banned) {
                const cur = fS.food;
                const qty = fS.quantity;
                k += qty*(parseInt(cur["nutrition_details"]["calories"]["value"])?parseInt(cur["nutrition_details"]["calories"]["value"]):(10*9)+(10*4)+(10*4));
                f += qty*(parseInt(cur["nutrition_details"]["fatContent"]["value"])?parseInt(cur["nutrition_details"]["fatContent"]["value"]):10);
                c += qty*(parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"])?parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"]):10);
                p += qty*(parseInt(cur["nutrition_details"]["proteinContent"]["value"])?parseInt(cur["nutrition_details"]["proteinContent"]["value"]):10);
            }
        }
        return [k,f,c,p];
    }
    getRequiredNutrition() {
        let k = 0;
        let f = 0;
        let c = 0;
        let p = 0;
        for (const property in this.board) {
            const fS = this.board[property]; // foodSquare
            if (fS.required) {
                const cur = fS.food;
                const qty = fS.quantity;
                k += qty*(parseInt(cur["nutrition_details"]["calories"]["value"])?parseInt(cur["nutrition_details"]["calories"]["value"]):(10*9)+(10*4)+(10*4));
                f += qty*(parseInt(cur["nutrition_details"]["fatContent"]["value"])?parseInt(cur["nutrition_details"]["fatContent"]["value"]):10);
                c += qty*(parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"])?parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"]):10);
                p += qty*(parseInt(cur["nutrition_details"]["proteinContent"]["value"])?parseInt(cur["nutrition_details"]["proteinContent"]["value"]):10);
            }
        }
        return [k,f,c,p];
    }
    getPlannedNutrition() {
        let k = 0;
        let f = 0;
        let c = 0;
        let p = 0;
        for (let i = 0; i < this.plannedMeal.length; i++) {
            const cur = this.plannedMeal[i].food;
            const qty = this.plannedMeal[i].quantity;
            k += qty*(parseInt(cur["nutrition_details"]["calories"]["value"])?parseInt(cur["nutrition_details"]["calories"]["value"]):(10*9)+(10*4)+(10*4));
            f += qty*(parseInt(cur["nutrition_details"]["fatContent"]["value"])?parseInt(cur["nutrition_details"]["fatContent"]["value"]):10)*9;
            c += qty*(parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"])?parseInt(cur["nutrition_details"]["carbohydrateContent"]["value"]):10)*4;
            p += qty*(parseInt(cur["nutrition_details"]["proteinContent"]["value"])?parseInt(cur["nutrition_details"]["proteinContent"]["value"]):10)*4;
        }
        return [k,f,c,p];
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
        const plannedMeal = await resp.json();
        // console.log(plannedMeal);
        this.plannedMeal = plannedMeal;
        if (this.controller) {
            this.controller.setPlan(plannedMeal);
        } else {
            // console.log("We gotta set the plan ourselves");
        }
        return plannedMeal;
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
