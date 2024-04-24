const express = require("express");
const path = require("path");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();

// Convert data into JSON format
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/Login-tut", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Database Connected Successfully");
    })
    .catch((err) => {
        console.error("Database Connection Error:", err);
    });

// Define Schema
const Loginschema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

// Define Model
const UserModel = mongoose.model("User", Loginschema);










// Serve the login page at the '/login' URL
app.get("/main/login", (req, res) => {
    res.sendFile(path.join(__dirname, "/main/login.html"));
});

// Serve the sign-up page at the '/signup' URL
app.get("/main/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "/main/signUp.html"));
});

// Handle user registration
app.post("/main/signup", async (req, res) => {
    try {
        const { name, password } = req.body;

        // Hash the password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user
        const newUser = new UserModel({ name, password: hashedPassword });
        
        // Save the user to the database
        await newUser.save();

        // Redirect the user to the index.html file after successful registration
        res.redirect("/main/index.html");

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('An error occurred while registering the user.');
    }
});

// Handle user login
app.post("/login", async (req, res) => {
    try {
        const { name, password } = req.body;
        
        // Find user by username
        const user = await UserModel.findOne({ name });

        if (!user) {
            return res.status(400).send("User not found");
        }

        // Check if the password matches
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).send("Incorrect password");
        }

        // Authentication successful
        res.sendFile(path.join(__dirname, "/main/index.html"));
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Define Port for Application
const port = 8000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});
