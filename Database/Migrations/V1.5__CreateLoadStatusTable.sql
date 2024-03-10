USE [Freshman15]
GO

CREATE TABLE RestaurantMealLoadStatus ( -- as opposed to usermeal, which will reference these as fk
  [RestaurantMealLoadStatusID] INT NOT NULL,
  [Status] VARCHAR(10) NOT NULL,
  CONSTRAINT Valid_Status CHECK ([Status] IN ('NoMeal','Loaded','Generated','FailedGenerated')), -- So either we've tried it or not; if we've tried we're either successful or not; we can be successful knowing there is or isn't a meal
  FOREIGN KEY(RestaurantMealLoadStatusID) REFERENCES RestaurantMeal(RestaurantMealID),
  PRIMARY KEY(RestaurantMealLoadStatusID) -- Like this to minimize FK size
)

GO