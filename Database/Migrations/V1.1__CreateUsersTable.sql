Use [Freshman15]
go
CREATE TABLE Users (
  UserID INT NOT NULL IDENTITY PRIMARY KEY,
  FirstName VARCHAR(35) NOT NULL,
  LastName VARCHAR(35) NULL,
  Major VARCHAR(30) NULL,
  Username VARCHAR(10) NOT NULL UNIQUE,
  [Password] VARCHAR(50) NOT NULL,
  [Year] varchar(30) NOT NULL,
  Check ([year] in ('Freshman','Sophomore','Junior','Senior','Graduate'))
)

--select * from users

--insert into users VALUES
--('Gaurav','Gajavelli','CS','gajavegs','hmm','Sophomore')

--insert into users VALUES
--('  ','Gajavelli','CS','gajavegs','hmm','Sophomore')