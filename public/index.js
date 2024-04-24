const express = require('express');
const app = express();
const path = require('path');
const hbs = require('hbs');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const tempelatePath = path.join(__dirname, '../public/main');

// const session = require('express-session');
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));
app.use(express.json());
app.use(bodyParser.json());
app.set("view engine", "hbs");
app.set("views", tempelatePath);
app.use(cors());
app.use(express.urlencoded({ extended: false }));

// Connect to MongoDB/////////////////////////////////////////////////////////////////
mongoose.connect("mongodb://localhost:27017/please_Connect_Hoja")
    .then(() => {
        console.log("MongoDB connected");
        // Start the server once MongoDB is connected
        createServer();
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB:", err);
    });

//

var validateEmail = function(email) {
    var re = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;
    return re.test(email)
};


// // Define the schema and model  signup
const SignUpSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: 'Email address is required',
        validate: [validateEmail, 'Please fill a valid email address'],
        match: [/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    }
});

console.log("Schema created:", SignUpSchema);
const Signup = mongoose.model("Signup", SignUpSchema);


// Routes

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/index", authenticateUser, (req, res) => {
    // Render the home page only if the user is authenticated
    res.render("index");
});

app.get('/order', (req, res) => {
    res.render('order');
});
app.get('/payment', (req, res) => {
    res.render('payment');
});



app.post("/signup", async(req,res)=>{

    const data = {
        name: req.body.name,
       
        email: req.body.email,
        password: req.body.password

    }
    try {
        // Insert data into the database
        await Signup.insertMany(data);
        
       //redirect to landing page login page
        res.redirect("/");
    } catch (error) {
        // Handle errors
        console.error("Error inserting signup data:", error);
        // Redirect to an error page or display an error message
        res.status(500).send("An error occurred while signing up.");
    }
});
app.post("/", async (req, res) => {
   //verification and authentication 

   const { email , password } = req.body;
console.log(req.body);
   try {
       // Check if the user exists in the database
       const user = await Signup.findOne({email:email});
       
       if (!user) {
           // User not found, redirect to login page or display an error message
           return res.status(404).send("User not found.");
       }

       // Check if the password matches
       if (password !== user.password) {
           // Incorrect password, redirect to login page or display an error message
           return res.status(401).send("Incorrect password.");
       }

       req.session.user = user;

       // Authentication successful, redirect to the home page
       res.redirect("/index");
   } catch (error) {
       // Handle errors
       console.error("Error during login:", error);
       res.status(500).send("Internal Server Error");
   }
});
//     res.redirect("/home");
// });
//////////////////////////////////////////////////////////////////////////

// Define schema and model for orders
// Define schema and model for orders
const OrderSchema = new mongoose.Schema({
    cartItems: [{ 
        imageSrc: String,
        itemName: String,
        cuisineType: String,
        priceText: String,
        location: String,
        openingHours: String
    }],
    selectedDate: String,
    selectedTime: String,
    packingDiningOption: String,
    totalMoney: String
});

const Order = mongoose.model("Order", OrderSchema);

// Route to save order
app.post("/index", authenticateUser, async (req, res) => {
    // Get cart items data, selected date, time, packing/dining option, and total money from request body
    const { cartItems, selectedDate, selectedTime, packingDiningOption, totalMoney } = req.body;

    try {
        // Create a new order instance
        const order = new Order({
            cartItems,
            selectedDate,
            selectedTime,
            packingDiningOption,
            totalMoney
        });

        // Save the order to MongoDB
        await order.save();

        res.status(200).send("Order placed successfully.");
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).send("Error placing order.");
    }
});

///////////////////////////////////////////////////////////////////////////////////////
app.post('/send-data', (req, res) => {
    const receivedData = req.body;

    // Retrieve existing session data or initialize as empty arrays if no data exists
    const existingCartItems = req.session.cartItems || [];
    const existingSelectedDate = req.session.selectedDate || "";
    const existingSelectedTime = req.session.selectedTime || "";
    const existingPackingDiningOption = req.session.packingDiningOption || "";
    const existingTotalMoney = req.session.totalMoney || "";

    // Append received data to existing session data
    req.session.cartItems = existingCartItems.concat(receivedData.cartItems || []);
    req.session.selectedDate = receivedData.selectedDate || existingSelectedDate;
    req.session.selectedTime = receivedData.selectedTime || existingSelectedTime;
    req.session.packingDiningOption = receivedData.packingDiningOption || existingPackingDiningOption;
    req.session.totalMoney = receivedData.totalMoney || existingTotalMoney;

    

    res.redirect('/order');
});

// Endpoint to retrieve data from session on receiver website
app.get('/get-data', (req, res) => {
    // Retrieve data from session and send it as response
    const data = {
        cartItems: req.session.cartItems || [],
        selectedDate: req.session.selectedDate || "",
        selectedTime: req.session.selectedTime || "",
        packingDiningOption: req.session.packingDiningOption || "",
        totalMoney: req.session.totalMoney || ""
    };
    res.json(data);
});
//////////////////////////////////////////////////////////////////////////////////
// // Function to create server
function createServer() {
    const desiredPort = 3001;
    let currentPort = desiredPort;

    const server = app.listen(currentPort, () => {
        console.log(`Server is running on port ${currentPort}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            // Port is already in use, try the next port
            console.log(`Port ${currentPort} is already in use. Trying the next port...`);
            currentPort++;
            createServer();
        } else {
            console.error('Server error:', error);
        }
    });
}
app.use(express.urlencoded({ extended: true }));


function authenticateUser(req, res, next) {
    // Check if user is logged in
    if (req.session && req.session.user) {
        // User is authenticated, proceed to the next middleware or route handler
        next();
    } else {
        // User is not authenticated, redirect to login page
        res.redirect("/"); // Assuming "/" is your login page
    }
}