// On the frontend, we can use some hash of the username as a unique identifier of their pages (so like url param or local storage) that we can use to key into their data
    // This way they can't guess new ones as easily as plaintext but we can still get em in
        // I don't wanna bother with JWT
// The front end should only keep track of 30 meals on that side at most (or some smaller number) to prevent overload/slowness
    // The way to ensure this is a stack like system or a counter of the number added or something like that
        // When counter hits past 30 uniques start replacing 'em
// Turn outdatabase into a sql query for their preferred bon restaurants' daily meals
    // Using like a lunch, dinner, and breakfast or some other kind of division of sprocs, instead of just the big kahuna
    // If it's slow start looking into indices

// Up next is sql-ifying all the current code
    // Then using the sql-ified code to implement
        // Restaurants as additional dropdown option
        // Signup page and federated id, also using sql table
            // https://developers.google.com/identity

export {}