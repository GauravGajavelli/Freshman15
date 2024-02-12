USE [Freshman15]
GO
-- Call with all the different foods, looping through the dates and meal
CREATE PROCEDURE insertFood (@json NVARCHAR(MAX), @date Date, @meal varchar(10))
AS
BEGIN

--DECLARE @json NVARCHAR(MAX);

--SET @json = N'[
--  {"id": 2, "info": {"name": "John", "surname": "Smith"}, "age": 25},
--  {"id": 5, "info": {"name": "Jane", "surname": "Smith"}, "dob": "2005-11-04T12:00:00"}
--]';

-- (@id int,@name varchar(35),
-- @kcal smallint,@c smallint,@p smallint,
-- @f smallint,@tier tinyint,@ss smallint,
-- @su varchar(35),@nl binary(1),@v binary(1),
-- @ve binary(1),@gf binary(1),@meal nvarchar(10),
-- @date date)

DECLARE @food TABLE
(
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

UPDATE @food SET meal=@meal,[day]=@date;

INSERT INTO @food (
  [ID],
  [Name],
  Calories,
  Carbohydrates,
  Protein,
  Fat,
  Tier,
  ServingSize,
  ServingUnits,
  Nutritionless,
  Vegetarian,
  Vegan,
  GlutenFree,
  ArtificialNutrition)
 SELECT * FROM OPENJSON(@json) WITH (
                        id INT 'strict $.id',
                        label VARCHAR(35) '$.label',
                        kcal SMALLINT '$.nutrition_details.calories.value',
                        c SMALLINT '$.nutrition_details.carbohydrateContent.value',
                        p SMALLINT '$.nutrition_details.proteinContent.value',
                        f SMALLINT '$.nutrition_details.fatContent.value',
                        tier TINYINT '$.tier',
                        ss SMALLINT '$.nutrition_details.servingSize.value',
                        su VARCHAR(35) '$.nutrition_details.servingSize.unit',
                        nl BIT '$.nutritionless',
                        v BIT '$.vegetarian',
                        ve BIT '$.vegan',
                        gf BIT '$.glutenfree',
                        an BIT '$.artificial_nutrition'
                        );

INSERT INTO Food SELECT * FROM @food; -- This will allow insertion of the read JSON into the table
END
GO