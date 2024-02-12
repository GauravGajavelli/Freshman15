USE [Freshman15]
GO
CREATE TABLE Food (
  [ID] INT NOT NULL PRIMARY KEY,
  [Name] VARCHAR(35) NOT NULL,
  Calories SMALLINT NULL,
  Carbohydrates SMALLINT NULL,
  Protein SMALLINT NULL,
  Fat SMALLINT NULL,
  Tier TINYINT NOT NULL,
  ServingSize SMALLINT NULL,
  ServingUnits VARCHAR(35) NULL,
  Nutritionless BIT NULL,
  Vegetarian BIT NULL,
  Vegan BIT NULL,
  GlutenFree BIT NULL,
  ArtificialNutrition BIT NULL,
  Meal VARCHAR(10) NULL,
  [Day] DATE NULL
)

-- Specifying schema of table for insert at allows you to only insert with some fields not null 

-- Group by a couple of columns count all of them to get counts of unique combos of said cols

-- (id: number, name: string, calories:number, carbs: number, 
-- rote: number, phat: number, melie:string,tear:foodTier, servingSize:number,
-- servingUnits:string,nutritionl:boolean,v:boolean,ve:boolean,gf:boolean)
