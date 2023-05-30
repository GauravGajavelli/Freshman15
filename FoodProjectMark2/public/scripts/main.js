var rhit = rhit || {};

rhit.FoodController = class {
	constructor() {
		document.querySelector("#createMealButton").onclick = (event) => {
            let numCals = parseInt(document.querySelector("#numCalories").value);
            if(numCals) {
                console.log("Number of calories desired: "+numCals);
                let totalCals = 0;
                let words = JSON.parse(window.sessionStorage.getItem("words")) || [];
				console.log("WARS: "+words);
				for (let i = 0; i < words.length; i++) {
                    console.log("Food: "+getFoodWithId(words[i]));
                    console.log(getCaloriesWithId(words[i])+" calories added");
                    console.log(getNutritionWithId(words[i]));
					totalCals += getCaloriesWithId(words[i]);
				}
				window.sessionStorage.clear(); // clears schedule
                console.log("Number of calories requested: "+totalCals);
            }
        }
	}
}


rhit.initializePage = function () {
	if (document.querySelector("#mainPage")) {
		new rhit.FoodController();		
	}
}

// /* Main */
// /** function and class syntax examples */
rhit.main = function () {
    rhit.initializePage();
};

rhit.main();