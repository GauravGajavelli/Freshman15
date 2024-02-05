
CREATE DATABASE [Freshman15]
ON
  PRIMARY ( NAME=[Freshman15], 
  FILENAME='/var/opt/mssql/data/Freshman15.mdf', 
  SIZE=6MB,
  MAXSIZE=5GB,
  FILEGROWTH=12%)
LOG ON
  ( NAME=[Freshman15_log], 
  FILENAME= '/var/opt/mssql/data/Freshman15_log.ldf', 
  SIZE=3MB,
  MAXSIZE=5GB,
  FILEGROWTH=17%)
COLLATE SQL_Latin1_General_Cp1_CI_AS