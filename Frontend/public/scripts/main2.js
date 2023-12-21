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
        // Prolly just get the 
		// const foods = document.querySelectorAll(".square");
        // for (const square of squares) {
		// 	square.onclick = (event) => {
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
		// const food = document.querySelector("#fuwafuwa");
		// food.innerHTML = this.model.foods;
        const newBoard = gung.htmlToElement('<div class="flex-container" id="foods"></div>');
        let board = this.model.getBoard();
        for (const property in board) {
            const fS = board[property]; // foodSquare
			// const mq = rhit.fbCalendarManager.getCalendarAtIndex(i);
            const newSquare = this._createSquare(fS);
			// const newCard = this._createCard(mq);
			// newCard.onclick = (event) => {
			// 	console.log(`you clicked on ${mq.id}`);
			// 	window.location.href = `/calendarDetail.html?id=${mq.id}`; //TODO GO HERE FOR Path Update
			// }
            newBoard.appendChild(newSquare);
			// newList.appendChild(newCard);
        }
        const oldBoard = document.querySelector("#foods");
		// const oldList = document.querySelector("#mainCalendarPage");
        oldBoard.removeAttribute("id");
		// oldList.removeAttribute("id");
        oldBoard.hidden = true;
		// oldList.hidden = true;
        oldBoard.parentElement.appendChild(newBoard);
		// oldList.parentElement.appendChild(newList);
    }
    _createSquare(fs) {
        if (fs.banned) {
            return gung.htmlToElement(`
            <div class="flex-item"><h1>${fs.food["label"]}</h1>
            <button>
              Add Back
            </button>
            </div>
            `);
        } else if (fs.required) {
            return gung.htmlToElement(`
            <div class="flex-item"><h1>${fs.food["label"]}</h1>
            <span>
              <span>
                <input type="number" id="quantity" min="1" value="${fs.quantity}"/>
              </span>
              <button>
                Remove
              </button>
            </span>
            </div>
            `);
        } else {
            return gung.htmlToElement(`
            <div class="flex-item"><h1>${fs.food["label"]}</h1>
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
}

// Model
    // Talks to the backend to save/load data
gung.Model = class {
    constructor(foodo) {
		// TODO: Make instance variables
		this.foods = foodo; // gets the object
        console.log(this.foods);
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
            response = await fetch("http://"+gung.apiUrl+"/"+gung.mealPath+"/0/0", {
                // mode: 'no-cors',
                method: 'GET',
                headers: {
                        "Content-Type": "application/json"
                }
            });
        } catch(err) {
            alert(err); // Failed to fetch
        }
        let test = await response.json();
        console.log("Contents: "+test);
        return new gung.Model(test);
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