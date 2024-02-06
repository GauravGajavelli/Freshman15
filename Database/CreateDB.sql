
CREATE DATABASE [Freshman15]
ON
  PRIMARY ( NAME=[Freshman15], 
  FILENAME='D:\rdsdbdata\DATA\Freshman15.mdf', 
  SIZE=6MB,
  MAXSIZE=5GB,
  FILEGROWTH=12%)
LOG ON
  ( NAME=[Freshman15_log], 
  FILENAME= 'D:\rdsdbdata\DATA\Freshman15_log.ldf', 
  SIZE=3MB,
  MAXSIZE=5GB,
  FILEGROWTH=17%)
COLLATE SQL_Latin1_General_Cp1_CI_AS