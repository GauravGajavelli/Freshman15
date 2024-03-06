USE [Freshman15]
GO
-- Call with all the different foods, looping through the dates and meal
CREATE OR ALTER PROCEDURE insertFood (@json VARCHAR(MAX), @date Date, @meal varchar(10))
AS
BEGIN
BEGIN TRANSACTION

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
  Meal VARCHAR(10) NULL,
  [Day] DATE NULL
)

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
                        kcal FLOAT(24) '$.nutrition_details.calories.value',
                        c FLOAT(24) '$.nutrition_details.carbohydrateContent.value',
                        p FLOAT(24) '$.nutrition_details.proteinContent.value',
                        f FLOAT(24) '$.nutrition_details.fatContent.value',
                        tier TINYINT '$.tier',
                        ss FLOAT(24) '$.nutrition_details.servingSize.value',
                        su VARCHAR(35) '$.nutrition_details.servingSize.unit',
                        nl BIT '$.nutritionless',
                        v BIT '$.vegetarian',
                        ve BIT '$.vegan',
                        gf BIT '$.glutenfree',
                        an BIT '$.artificial_nutrition'
                        );

UPDATE @food SET meal=@meal,[day]=@date;

INSERT INTO Food SELECT * FROM @food; -- This will allow insertion of the read JSON into the table

IF (@@ERROR = 1)
BEGIN
ROLLBACK TRANSACTION;
RETURN(1);
END



--SELECT * FROM Food
COMMIT TRANSACTION
RETURN(0);
END
GO

-- -- Example call
-- EXEC insertFood @json = N'{"id":"5423187","label":"yogurt vanilla low fat","description":"string","short_name":"string","raw_cooked":1010101,"meal":"dinner","tier":2,"nutritionless":false,"artificial_nutrition":false,"nutrition":{"kcal":"60","well_being":1010101},"station_id":1010101,"station":"string","nutrition_details":{"calories":{"value":"60","unit":"string"},"servingSize":{"value":"0.3","unit":"oz"},"fatContent":{"value":"1","unit":"string"},"carbohydrateContent":{"value":"9","unit":"string"},"proteinContent":{"value":"3","unit":"string"}},"ingredients":["string[]"],"sub_station_id":1010101,"sub_station":"string","sub_station_order":1010101,"monotony":{},"vegetarian":true,"vegan":false,"glutenfree":true}'
-- , @date = '2017-08-25',@meal = 'breakfast';

-- Invalid input that appears that appears in the data ('<1')
--  EXEC insertFood @json = N'{"id":"5423187","label":"yogurt vanilla low fat","description":"string","short_name":"string","raw_cooked":1010101,"meal":"dinner","tier":2,"nutritionless":false,"artificial_nutrition":false,"nutrition":{"kcal":"60","well_being":1010101},"station_id":1010101,"station":"string","nutrition_details":{"calories":{"value":"60","unit":"string"},"servingSize":{"value":"0.3","unit":"oz"},"fatContent":{"value":"1","unit":"string"},"carbohydrateContent":{"value":"9","unit":"string"},"proteinContent":{"value":"< 1","unit":"string"}},"ingredients":["string[]"],"sub_station_id":1010101,"sub_station":"string","sub_station_order":1010101,"monotony":{},"vegetarian":true,"vegan":false,"glutenfree":true}'
-- , @date = '2017-08-25',@meal = 'breakfast';

-- SELECT COUNT(*) FROM Food
-- DELETE FROM Food
