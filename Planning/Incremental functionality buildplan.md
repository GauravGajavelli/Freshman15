Incremental functionality buildplan (talk abt this since I'm having to do this as I come up with new ideas that add. on to og plan):
- Choosing one of multiple restaurants
- Lazy loading with loading screen (just a modal with a barber pole) and text that says loading from site and after loaded foods appear 'gpt-ifying' for respective steps
  - The way this will work is that there will be a table similar to valid meals (which foods will reference to identify what meal they're part of btw) that contains the current scraping status of meals (identifying them by university/restaurant (these point to that table with locations and urls), day, etc); it'll ping repeatedly and while the status id still scraping or gpt-ifying it'll display the appropriate message
- Federated google login working
  - Little message/modal/t style redirect to federated clicking the save meal or preferences buttons also like a login or signup button with small text and the same message just ape yt
  - Need to start splitting backend into services, includding a UserService.js
- Sign up where they can preset preferences and set locations (midnight scraped from dropdown for institute, college, or university)
  - This is another table, location and specific restaurant to url
- Profile page where they can update preferences
- Ability to update/customize nutrition of gpt-d foods
 - Also don't have add/remove on the display yet unless they click a "manually add/remove items" button
 - This will force login if attempted by guests
 - Will visually highlight the foods as yellow
 - Also have a disclaimer of inaccuracy on gpt nutrition modal and meals/sets of food items like reas containing gpt-d foods
 - Also the ability to add foods, which will functionally do the same thing (force login, yellow foods, etc.)
- Abilitv to save meals
  - Meal table and users table required in db
  - also a create meal button and a choose meal dropdown and a save meal button
  - in both profile and main page the ability to make a meal your chosen meal
    - Dropdown in profile page to choose day, allowing you to see cumulative nutrition of chosen meals across day
 - Also to choose which bon appetit locations you are a part of (these are preloaded, up to three)
- Overhaul styling w bootstrap 5
  - Do this first so I don't have to redo as much later
  - See examples sent to phillip (or use them muahahaha)
- Hover over food units infographic rectangle to help with unit understandings

- Maybe can be advertised as an extension that just shows the pie chart thing and nutrition facts after a small square version of the loading screen or whatever, and directs you to the site for further customization if you click on it or select customize plan
  - Use extension as main foot forward it's more compelling, make it have most if not all funvtionality and use the existing preferences select on bon site
  - will have to make a few splash images with slogans demoing features (eg you can add foods, get your meals calculated for you, have your added food nutrition estimated)
  - Maybe nice ketchup and mustard themed mascots

- For db performance concerns, consider strategically using indices, ie on column that we’ll do heavy sprocs on even, e.g., for search feature
 - It worked wonders for that movie db group
 - Also using the ability to throttle repeated requests until after user input has stopped for like 0.1 seconds (when they're finished)
 - Basically just taking inspiration from the other groups' 333 projects

- Also don't forget alex and philip-style outreach plans; reach out to their open source software clubs, their social media presences, linkedin etc not necessarily pushing but asking who to push (ie an open source software club) to gain more users
  - At rose at least tho, target at people who are concerned about getting fat or dietary restrictions, and specifically those freshmen who may be anxious about their future on campus

- I can't do SQL stuff and file stuff simultaneously
  - I have to/should try to do everything in one await each
  - For example, instead of having it be a choice between one endpoint that potentially we use for both checking and getting data, we have to split into to differnet endpoints

- When adding functionality, create an epic with disordered "tickets" as you imagine the funcionality happening
  - Then order and do

- The most important skill for a software engineer is to slog, even when it sucks

- A big thing I learned with this project is how to take a raw idea with its appeal, into chunks, and then chunk those chunks, and then split those into doable segments
  - Splitting into epics and tickets from a disarrayed list of features
    - Writing out everything beforehand starting each Epic, and writing each Epic contained within new stories

=======================================================================================================================================================================

Current Epic: Lazy Loading
- Tickets
  1. Create loading into Meal/Load Status
  2. 
  3. 
  4. 
  5. 
  6. 

=======================================================================================================================================================================

Future Epics (and any specific tickets): 
- Signup
- Bootstrapify All
  1. Create all final frintend files
  2. Add bootstrap to them
  3. Draw out FSM of the loading process from what state the page is and what the load status is
     a. This can be used to more easily structure what users can see based on state; use like an enum to encode
     b. Thus is a thing: https://www.google.com/search?q=ui+finite+state+machine&oq=ui+finite+state+machine&gs_lcrp=EgZjaHJvbWUyBggAEEUYOdIBCDQyNzhqMGoxqAIAsAIA&sourceid=chrome&ie=UTF-8
- DeleteOldData
  1. Mark tables that are related to scraping with the date they were scraped on
  2. Create a SPROC that deletes all records from the tables with a provided date a week before today
     a. User created data shouldn't be though
  3. Get a nightly routine to call it

=======================================================================================================================================================================

Past Epics: 
- 