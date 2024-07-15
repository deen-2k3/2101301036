const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(bodyParser.json());

// MongoDB connection
const dbUrl = "mongodb://127.0.0.1:27017/test";
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});

// Define Mongoose Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});
const User = mongoose.model('User', userSchema);

// Function to authenticate against external endpoint
async function authenticateUser(req, res, next) {
    const { username, password } = req.body;

    try {
        // Example of authentication against external endpoint
        const response = await axios.post('http://20.40.56.144/test/auth', { username, password });
        if (response.status === 200) {
            next(); // User authenticated, proceed to next middleware
        } else {
            res.status(401).json({ error: 'Authentication failed' });
        }
    } catch (error) {
        console.error('Error authenticating user:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Route for user registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user already exists
        let existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            username,
            password: hashedPassword,
        });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route for user login and JWT generation
app.post('/login', authenticateUser, async (req, res) => {
    const { username } = req.body;

    try {
        // Generate JWT
        const token = jwt.sign({ username }, 'your_secret_key', { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        console.error('Error generating JWT:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).json({ error: 'Authentication token required' });
    }

    jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}




// Define the root route
app.get('/', (req, res) => {
    res.send('Welcome to the Company Registration API');
});

// Start the server and listen on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
