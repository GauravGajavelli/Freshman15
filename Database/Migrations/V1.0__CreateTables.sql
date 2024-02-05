CREATE TABLE Following(
	Follower INT,
	PersonFollowing INT,
	PRIMARY KEY(Follower, PersonFollowing)
);

CREATE TABLE Has(
	HasTagID INT,
	HasProjID INT,
	PRIMARY KEY(HasTagID,HasProjID)
);

CREATE TABLE Interests(
	InterestsTagID INT,
	InterestsUserID INT,
	PRIMARY KEY(InterestsTagID,InterestsUserID)
);

CREATE TABLE Project(
	ProjectID INT IDENTITY,
	ProjName VARCHAR(100) NOT NULL,
	StartDate DATE NOT NULL,
	EndDate DATE,
	ProjStatus VARCHAR(30) NOT NULL, --'Looking For Team', 'Finalized Team', 'In Progress', 'Completed'
	ProjDescription VARCHAR(500) NOT NULL,
	CreatorID int NOT NULL,
	CHECK (ProjStatus IN ('Looking For Team', 'Finalized Team', 'In Progress', 'Completed')),
	PRIMARY KEY(ProjectID)
);

CREATE TABLE Schedule (
  EntryID INT NOT NULL IDENTITY PRIMARY KEY,
  StartTime TIME NOT NULL,
  EndTime TIME NULL,
  StartDate DATE NOT NULL,
  EndDate DATE NULL,
  UserID INT NOT NULL,
  CHECK((ENDTIME IS NULL AND ENDDATE IS NULL) OR (ENDTIME IS NOT NULL AND ENDDATE IS NOT NULL AND
  (cast(StartDate as datetime) + cast(StartTime as datetime)) < (cast(EndDate as datetime) + cast(EndTime as datetime))
))
);

CREATE TABLE Tags(
	TagID INT IDENTITY,
	TagName VARCHAR(30) NOT NULL UNIQUE,
	CreatorID int NOT NULL,
	PRIMARY KEY(TagID)
);

CREATE TABLE Users (
  UserID INT NOT NULL IDENTITY PRIMARY KEY,
  FirstName VARCHAR(35) NOT NULL,
  LastName VARCHAR(35) NULL,
  Major VARCHAR(30) NULL,
  Username VARCHAR(10) NOT NULL UNIQUE,
  Password VARCHAR(50) NOT NULL,
  [Year] varchar(30) NOT NULL,
  check ([Year] in ('Freshman','Sophomore','Junior','Senior','Graduate')
);


CREATE TABLE WorksOn(
	WOProjID INT,
	WOUserID INT,
	PRIMARY KEY(WOProjID, WOUserID)
);

CREATE TABLE ProjectInvites
		(requestedInvite int REFERENCES Users(UserID),
		projectOwner int REFERENCES Users(UserID),
		projectID int REFERENCES Project(ProjectID),
		PRIMARY KEY (requestedInvite,projectOwner,projectID)
);

ALTER TABLE [Following]
ADD CONSTRAINT FK_Follower_User FOREIGN KEY (Follower) REFERENCES Users(UserID);

ALTER TABLE [Following]
ADD CONSTRAINT FK_Person_Following FOREIGN KEY (PersonFollowing) REFERENCES Users(UserID);

ALTER TABLE Has
ADD CONSTRAINT FK_Has_Tag FOREIGN KEY (HasTagID) REFERENCES Tags(TagID);

ALTER TABLE Has
ADD CONSTRAINT FK_Has_Project FOREIGN KEY (HasProjID) REFERENCES Project(ProjectID);

ALTER TABLE Interests
ADD CONSTRAINT FK_Interests_Tag FOREIGN KEY (InterestsTagID) REFERENCES Tags(TagID);

ALTER TABLE Interests
ADD CONSTRAINT FK_Interests_Users FOREIGN KEY (InterestsTagID) REFERENCES Users(UserID);

ALTER TABLE Project
ADD CONSTRAINT FK_Project_User FOREIGN KEY (CreatorID) REFERENCES Users(UserID);

ALTER TABLE Schedule
ADD CONSTRAINT FK_Schedule_User FOREIGN KEY (UserID) REFERENCES Users(UserID);

ALTER TABLE WorksOn
ADD CONSTRAINT FK_WorksON_Project FOREIGN KEY (WOProjID) REFERENCES Project(ProjectID);

ALTER TABLE WorksOn
ADD CONSTRAINT FK_WorksON_User FOREIGN KEY (WOUserID) REFERENCES Users(UserID);

ALTER TABLE Tags
ADD CONSTRAINT FK_Tag_User FOREIGN KEY (CreatorID) REFERENCES Users(UserID);