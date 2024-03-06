USE [Freshman15]
GO
-- Call with all the different foods, looping through the dates and meal
CREATE OR ALTER PROCEDURE InsertRestaurantMeal (@day Date, @meal varchar(10))
AS
BEGIN
BEGIN TRANSACTION

INSERT INTO RestaurantMeal VALUES (@meal,@day); -- This will allow insertion of the read JSON into the table

IF (@@ERROR = 1)
BEGIN
ROLLBACK TRANSACTION;
RETURN(1);
END

COMMIT TRANSACTION
RETURN(0);
END
GO