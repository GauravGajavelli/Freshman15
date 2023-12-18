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
	constructor() {
        this.model = new gung.Model();
        // Prolly just get the 
		const foods = document.querySelectorAll(".square");
        for (const square of squares) {
			square.onclick = (event) => {
				const buttonIndex = parseInt(square.dataset.buttonIndex);
				// console.log("buttonIndex", buttonIndex);
				// console.log(typeof(buttonIndex));
				this.game.pressedButtonAtIndex(buttonIndex);
				this.updateView();
			};
		}
	}
    updateView() {
		const squares = document.querySelectorAll(".square");
		// forEach receives a function
		squares.forEach((square, index) => {
			square.innerHTML = this.game.getMarkAtIndex(index);
		});
		document.querySelector("#gameStateText").innerHTML = this.game.state;
    }
}

// Model
    // Talks to the backend to save/load data
gung.Model = class {
    
}


gung.initializePage = function () {
	if (document.querySelector("#mainPage")) {
		new gung.FoodController();		
	}
}

// /* Main */
// /** function and class syntax examples */
gung.main = function () {
    gung.initializePage();
};

gung.main();