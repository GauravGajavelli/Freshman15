Incremental functionality buildplan (talk abt this since I'm having to do this as I come up with new ideas that add. on to og plan):
- Choosing one of multiple restaurants
- Lazy loading with loading screen (just a modal with a barber pole) and text that says loading from site and after loaded foods appear 'gpt-ifying' for respective steps
  - The way this will work is that there will be a table similar to valid meals (which foods will reference to identify what meal they're part of btw) that contains the current scraping status of meals (identifying them by university/restaurant (these point to that table with locations and urls), day, etc); it'll ping repeatedly and while the status id still scraping or gpt-ifying it'll display the appropriate message
- Federated google login working
- Little message/modal/t style redirect to federated clicking the save meal or preferences buttons also like a login or signup button with small text and the same message just ape yt
- Sign up where they can preset preferences and set locations (midnight scraped from dropdown for institute, college, or university)
- This is another table, location and specific restaurant to url
- Profile page where they can update preferences
- Ability to update/customize nutrition of gpt-d foods
 - Also don't have add/remove on the display yet unless they click a "manually add/remove items" button
 - This will force login if attempted by guests
 - Will visually highlight the foods as yellow
 - Also have a disclaimer of inaccuracy on apt nutrition modal and meals/sets of food items like reas containing apt-d foods
 - Sldo the ability to add foods, which will functionally do the same thing (force login, yellow foods, etc.)
- Abilitv to save meals
- Meal table and users table required in db
- also a create meal button and a choose meal dropdown and a save meal button
- in both profile and main page the ability to make a meal your chosen meal
- Dropdown in profile page to choose day, allowing you to see cumulative nutrition of chosen meals across days
- Also to choose which bon appetit locations you are a part of (these are preloaded, up to three)
- Overhaul styling w bootstrap 5
- Hover over food units to help with unit understandings

- Maybe can be advertised as an extension that just shows the pie chart thing and nutrition facts after a small square version of the loading screen or whatever, and directs you to the site for further customization if you click on it or select customize plan
  - Use extension as main foot forward it's more compelling, make it have most if not all funvtionality and use the existing preferences select on bon site

- For db performance concerns, consider strategically using indices, ie on column that we’ll do heavy sprocs on even, e.g., for search feature
 - It worked wonders for that movie db group
 - Also using the ability to throttle repeated requests until after user input has stopped for like 0.1 seconds (when they're finished)
 - Basically just taking inspiration from the other groups' 333 projects

- Also don't forget alex and philip-style outreach plans; reach out to their open source software clubs, their social media presences, linkedin etc not necessarily pushing but asking who to push (ie an open source software club) to gain more users
- At rose at least tho, target at people who are concerned about getting fat or dietary restrictions, and specifically those freshmen who may be anxious about their future on campus
