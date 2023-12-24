// When adding new stuff
    // 1. add it to the model first
    // 2. then create the view

/** namespace. */
var gung = gung || {};
 
/** globals */
gung.variableName = "";
gung.apiUrl = "localhost:3000";
gung.mealPath = "get_meal";

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
        const foods = document.querySelectorAll("#foods .flex-item");
		// for (const food of foods) {
		// 	food.onclick = (event) => {
		// 		const buttonIndex = parseInt(square.dataset.buttonIndex);
		// 		// console.log("buttonIndex", buttonIndex);
		// 		// console.log(typeof(buttonIndex));
		// 		this.game.pressedButtonAtIndex(buttonIndex);
		// 		this.updateView();
		// 	};
		// }
        this.updateView();
	}
    static async makeController() {
        const model = await gung.Model.fetchModel();
        // Invoke the private constructor...
        return new gung.FoodController(model);
    }
    updateView() {
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
    constructor(foodo) {
		// TODO: Make instance variables
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
        let response = {};
        try {
            response = await fetch("http://"+gung.apiUrl+"/"+gung.mealPath+"/4/1", {
                // mode: 'no-cors',
                method: 'GET',
                headers: {
                        "Content-Type": "application/json"
                }
            });
        } catch(err) {
            alert(err); // Failed to fetch
        }
        return new gung.Model(await response.json());
    }
    getBoard() {
        return this.board;
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