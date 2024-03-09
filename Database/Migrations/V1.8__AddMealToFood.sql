USE [Freshman15]
GO

DROP TABLE Food

CREATE TABLE Food (
  [ID] INT NOT NULL,
  [Name] VARCHAR(35) NOT NULL,
  Calories FLOAT(24) NULL,
  Carbohydrates FLOAT(24) NULL,
  Protein FLOAT(24) NULL,
  Fat FLOAT(24) NULL,
  Tier TINYINT NOT NULL,
  ServingSize FLOAT(24) NULL,
  ServingUnits VARCHAR(35) NULL,
  Nutritionless BIT NULL,
  Vegetarian BIT NULL,
  Vegan BIT NULL,
  GlutenFree BIT NULL,
  ArtificialNutrition BIT NULL,
  RestaurantMealID INT NOT NULL, 
  PRIMARY KEY([ID],RestaurantMealID)
)

-- Specifying schema of table for insert at allows you to only insert with some fields not null 

-- Group by a couple of columns count all of them to get counts of unique combos of said cols

-- (id: number, name: string, calories:number, carbs: number, 
-- rote: number, phat: number, melie:string,tear:foodTier, servingSize:number,
-- servingUnits:string,nutritionl:boolean,v:boolean,ve:boolean,gf:boolean)
