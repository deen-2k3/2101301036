
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());

// Route for registration
app.post('/register', async (req, res) => {
    const { companyName, ownerName, rollNo, ownerEmail } = req.body;

    //access code
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
        const response = await axios.post('http://20.244.56.144/test/register', registrationData)
        res.status(response.status).json(response.data);
    } catch (error) {
        // Handle error
        console.error('Error registering company:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            res.status(500).json({ error: 'No response received from the test server' });
        } else {
            // Something happened in setting up the request that triggered an Error
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
