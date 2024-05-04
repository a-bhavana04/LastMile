// app.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
// Configure body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Set the directory to serve static files like CSS, JavaScript, and images
app.use(express.static(path.join(__dirname, 'public')));

// Set the directory to serve EJS files from the 'views' folder
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017";
const dbName = "lastmile";

// Function to connect to MongoDB
async function connect() {
  try {
    // Create a new MongoClient instance
    const client = new MongoClient(uri);
    
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB server");

    // Access the database
    const db = client.db(dbName);
    console.log('out');
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    console.log('out with error');
    throw error;
  }
  
}
// Routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/business', (req, res) => {
  res.render('business');
});
app.get('/gensm', (req, res) => {
    // Retrieve the user ID from the request query parameters
    const userId = req.query.userId;

    // Render the gensm.ejs template and pass the userId as data
    res.render('gensm', { userId });
});
app.get('/fleet', (req, res) => {
  res.render('fleet');
});
app.post('/blogin', async (req, res) => {
    const { username, password, mode } = req.body;
    var table = "";
    if (mode !== "fleet") {
        table = 'business';
    } else {
        table = 'fleet';
    }
    console.log(username, password, mode, table);
    try {
        // Connect to MongoDB
        const db = await connect();
        console.log("DEBUG DB... 1");
        // Define collection
        const userCollection = db.collection(table);
        console.log("DEBUG DB... 2");
        // Find user by username
        const user = await userCollection.findOne({ username });
        console.log(user);
        console.log("DEBUG DB... 3");
        if (!user) {
            return res.send('incorrect username or password'); // Send response if user not found
        }
        console.log("DEBUG DB... 4");
        // Check password
        if (user.password !== password) {
            return res.send('incorrect username or password'); // Send response if password is incorrect
        }
        console.log("Success. ", user.username + " " + user.password);
        // Render different views based on the mode
        if (mode !== "fleet") {
            const ordersCollection = db.collection('businessorders');
            const orders = await ordersCollection.find({ userId: user.id }).toArray();
            console.log(orders);
            // Render bhome view with orders data
            return res.render('bhome', { name: username, orders });
        } else {
            // Render fleet home view and send user data
            return res.render('fhome', { id: user.id, name: username });
        }
    } catch (error) {
        console.log("Error logging in:", error);
        return res.status(500).send('Error logging in'); // Send error response
    }
});
app.get('/showfleets', async (req, res) => {
    const { toLocation } = req.query;
    console.log(toLocation);
    try {
        // Connect to MongoDB
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db(dbName);

        // Search for fleets based on the "To" location
        const fleetCollection = db.collection('fleet');
        const matchingFleets = await fleetCollection.find({ Regions: toLocation }).toArray();
        console.log(matchingFleets)
        // Render the choosefleet.ejs template with the matching fleets
        res.render('choosefleet', { fleets: matchingFleets });
    } catch (error) {
        console.error("Error retrieving fleets:", error);
        res.status(500).send('Error retrieving fleets');
    }
});

app.get('/choosefleet', (req, res) => {
    res.render('choosefleet', { fleets: [] }); // Initialize with empty fleets
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
