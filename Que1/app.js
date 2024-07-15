const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongoose = require('mongoose'); // Import Mongoose

const app = express();

// Middleware
app.use(bodyParser.json());

// MongoDB connection
const dbUrl = "mongodb://127.0.0.1:27017/test"; // Replace with your MongoDB connection string
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process on connection error
});

// Define Mongoose Schema (example)
const companySchema = new mongoose.Schema({
    companyName: String,
    ownerName: String,
    rollNo: Number,
    ownerEmail: String
});
const Company = mongoose.model('Company', companySchema);

// Route for registration
app.post('/register', async (req, res) => {
    const { companyName, ownerName, rollNo, ownerEmail } = req.body;

    // Access code
    const accessCode = "yBXcjs";

    // Data to send to the test server
    const registrationData = {
        companyName,
        ownerName,
        rollNo,
        ownerEmail,
        accessCode
    };

    try {
        // Example of saving data to MongoDB using Mongoose
        const newCompany = new Company({
            companyName,
            ownerName,
            rollNo,
            ownerEmail
        });
        await newCompany.save();

        // Example of making external API call
        const response = await axios.post('http://20.244.56.144/test/register', registrationData);
        res.status(response.status).json(response.data);
    } catch (error) {
        // Handle error
        console.error('Error registering company:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            res.status(500).json({ error: 'No response received from the test server' });
        } else {
            res.status(500).json({ error: 'Error setting up request to the test server' });
        }
    }
});

// Define the root route
app.get('/', (req, res) => {
    res.send('Welcome to the Company Registration API');
});

// Start the server and listen on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
