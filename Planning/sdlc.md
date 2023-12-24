So my goal with this iteration of food app is to follow the SDLC a little more so I can use it in future projects

Reference AirPizza and the project plan we made for it

The goal is to follow this advice: https://www.youtube.com/watch?v=LBc8bXoK61Y
- So quantify backend performance, # users, search for other impressive metrics that indicate scale/performance, # seconds saved, etc.

1. Planning (for UI nitty gritty copy linkedin and insta)
- Appeal
  - Connecting with others through the app as friends like insta, so you can share schedules
  - Also makes healthy meals and choicecs no brainers
- Start with data gathering
  - Start with being able to puppeteer it off (webscraping workflow: figure out selectors, figure out inputs, code)
  - Learn AWS and GCP to (do basic cloud practitioner certs) for the summer and to figure out how to host SQL Server like in: 
    - https://learn.microsoft.com/en-us/sql/connect/node-js/node-js-driver-for-sql-server?view=sql-server-ver16
    - https://www.youtube.com/watch?v=zvvqUsvB540
  - Then go screen by screen
    - First the .pdf one, with file processing db
    - Then use sql knowledge to design schema with features of other pages in mind
    - Then import data to AWS or whatever online schema with SQL Server
  - Then it's simply a matter of building out the front and backends for each of the pages (prolly backend first)
   - Frontends mobile first at the end, try to 'sincerest form of flattery' stuff like Instacart, Instagram, etc.
2. Analysis
3. Design
- Features
  - Bon appetit extension/new tab widget is cool - Luke Buchanan
- Main screens: 
  - The one in the .pdf, with login or guest use (actually that's at the top of all pages)
    - It's like the flow of the java app
      - But instead of having to clicky clicky, you just scroll down for the list view, and check off the whole meal if you've chosen it
    - For a first one: 
      - A dropdown to choose the day (shows yesterday to the next five days that the bon is open)
        - Also a dropdown to choose the meal
      - Creates a grid of foods (DONE)
        - Actually two, one for both the daily specials and one for the rest
        - Need to straddle js and html, have api call
      - Required/banned columns (DONE)
        - Every time you click an item, the required/banned columns below it (required and at one frequency) are filled
        - You can remove an item from the required/banned by clicking on it, just by clicking the 'Remove this' that appears in the names place
        - There should also be a column for the generated meal (DONE)
          - Required foods added are red at the top
      - A search bar (DONE)
        - Reloads the grid each time with the given selections
        - Can search by either attributes or by name
          - Using a trie? Or maybe that article I found for Open Gradebook
      - Instruction modal from a question mark top left
        - Later, when feature set is set
      - Have filters like vegetarian etc (the presets set in profile but the specific meals can be adjusted in here) (DONE)
        - Also have a search filter like for Open Gradebook
      - Instead of clicking the item, clone like instacart checking off (DONE)
      - At the bottom there are people you can connect with like LinkedIn
        - Not necessary yet
      - Login/site navigation. Need to use Rose email to set up, or phone
        - Use that header thing that was always red on our apps
  - A profile settings screen with dietary preferences (need login to use)
    - Caloric amounts
    - Veg etc.
    - The connection recommendations are here too
    - Your meal plan
    - Your db amount
  - Scheduling screen (need to log in to use)
    - You enter your school/extracurricular schedule
      - Ooh this can link up with the automatic scheduling notifier app when someone tries to message or call you when occupied
      - You can match up schedules in O(24*n) times by looking at basically bitwise and-ing to find overlaps
      - You can enter preferred times
      - You can also enterred preferred department (yours or not), (only ungreys once the webscraping api request is completed)
        - Like if the profile is not null
      - Performance constraints: 
    - You can also see the schedules of people you are eating
    - Can uncheck stuff like outlook (layers include bon, chaunceys opening, as well as friend schedules)
    - You can check who you want to eat with in one mode, but you can click to another tab and this will generate a random next meal and show you their name (whole ui is just NEXT MEAL: LUNCH And then, RANDOM LUNCH BUDDY: JUANITA)
  - Previous meals viewer (with macros displayed prominently with those pie chart-ring things based on the hei)
    - Imagine rounded gray-white rectangles (little shadows below panes)
    - Just a bunch of panes with a short summary of the food, maybe like 4 a row and columns loading as you scroll down
4. Implementation
- Have a good readme to prove good documentation (copy similar projects' formatting)
- React
  - Need reactivity from many elements/panes
- Typescript
  - For better type safety
- Node.js
 - Puppeteer web scraper familiarity
5. Testing & Integration
- Use a folder for it
- Jest, Mocha, seem good
- I should do TDD
- Bugs: SOUTHWEST BEEF BOWL CASE 12-22-23 LUNCH, IDENTIFY WHY THE NUTRITION DETAILS ARE MISSING (POTENTIALLY DUE TO THE VARIABILITY OF THE ITEM)
  - Make elements red if they have this flag, add a separate display if needed for this type
  - Okay asking chatgpt about the red ones ahead of time seems like a plausible strategy, I just need to run it at like midnight
    - The vegetarian label seems mostly accurate but for the foods that it's not on, if there's a description then that's typically a good indicator or whether it's edible for them. Just create alternate versions of the meal for the different intersections of dietary preferences, e.g., vegetarian, vegan, gluten-free like so and using the description
    - "Based on the following food name, provide a nutritional breakdown of half a standard plate of the item by a specified serving: "southwest beef bowl", given the following description: "southwest braised beef, braised beans, steamed rice, steamed corn, salsa, sour cream, lettuce, diced tomato, and jalapeno", for a vegan. Only the ingredients in the description can be used as substitutes"
      - Keep iteratively improving prompt
  - Should be able to filter by daily special,  additional, etc.
  - For the red ones, do a little fake loading thing, and put a chatgpt logo on the bottom and turn them from red to green as the results are "gotten" from chatgpt (they're already there)
- Also use chatgot for serving sizes (use the ladel or plate portion of deck of cards width with visualization) depending on the more appropriate serving size
- Approximate linear algebra solver javascript
  - Literally like 4 linear equations
    - If it can converge quickly/or not then I can tell whether certain food combos work
    - The trouble is efficiently selecting the 
  - This is all I need for meal generation
6. Maintenance
- Hmm
