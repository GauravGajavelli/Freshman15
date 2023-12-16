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
    - It's like the flow of the java app, but instead of having to clicky clicky, you just scroll down for the list view, and check off the whole meal if you've chosen it
    - Have filters like vegetarian etc (the presets set in profile but the specific meals can be adjusted in here)
      - Also have a search filter like for Open Gradebook
    - Instead of clicking the item, clone like instacart checking off
    - At the bottom there are people you can connect with like LinkedIn
    - Need to use Rose email to set up, or phone
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
6. Maintenance
- Hmm
