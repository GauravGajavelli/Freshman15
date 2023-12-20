/** namespace. */
var gung = gung || {};
 
/** globals */
gung.variableName = "";

/** function and class syntax examples */
gung.functionName = function () {
	/** function body */
};

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
		const food = document.querySelectorAll("#fuwafuwa");
		// forEach receives a function
		// squares.forEach((square, index) => {
		// 	square.innerHTML = this.game.getMarkAtIndex(index);
		// });
		food.innerHTML = this.model.foods;
    }
}

// Model
    // Talks to the backend to save/load data
gung.Model = class {
    constructor(foodo) {
		// TODO: Make instance variables
		this.foods = foodo;
		// for (let k = 0; k < 9; k++ ) {
		// 	this.board.push(rhit.Game.Mark.NONE);
		// }
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
    static async fetchModel() {
        // Perform `async` stuff here...
        const response = await fetch("http://localhost:3000/send_meals/1");
        // Invoke the private constructor...
        return new gung.Model(await response.json());
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