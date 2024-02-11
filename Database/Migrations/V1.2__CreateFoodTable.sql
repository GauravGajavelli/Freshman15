
CREATE TABLE Food (
  [ID] INT NOT NULL PRIMARY KEY,
  [Name] VARCHAR(35) NOT NULL,
  Calories SMALLINT NULL,
  Carbohydrates SMALLINT NULL,
  Protein SMALLINT NULL,
  Fat SMALLINT NULL,
  Tier TINYINT NOT NULL,
  ServingSize INT NULL,
  ServingUnits VARCHAR(35) NULL,
  Nutritionless BINARY(1) NULL,
  Vegetarian BINARY(1) NULL,
  Vegan BINARY(1) NULL,
  GlutenFree BINARY(1) NULL,
  Meal NVARCHAR(10) NOT NULL,
  [Day] Date NOT NULL
)

-- Specifying schema of table for insert at allows you to only insert with some fields not null 

-- Group by a couple of columns count all of them to get counts of unique combos of said cols

-- (id: number, name: string, calories:number, carbs: number, 
-- rote: number, phat: number, melie:string,tear:foodTier, servingSize:number,
-- servingUnits:string,nutritionl:boolean,v:boolean,ve:boolean,gf:boolean)
