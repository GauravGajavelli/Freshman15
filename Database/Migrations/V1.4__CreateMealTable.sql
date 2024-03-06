USE [Freshman15]
GO

CREATE TABLE RestaurantMeal ( -- as opposed to usermeal, which will reference these as fk
  [RestaurantMealID] INT IDENTITY(1,1) NOT NULL,
  Meal VARCHAR(10) NOT NULL,
  [Day] DATE NOT NULL,
  CONSTRAINT UC_RestaurantMeal UNIQUE (Meal,[Day]), -- will eventually use restaurant too
  PRIMARY KEY(RestaurantMealID) -- Like this to minimize FK size
)

