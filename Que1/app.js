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

// For Develop a Top Products HTTP Microservices

const fetchData = async (company, category, top, minPrice, maxPrice) => {
    try {
        const response = await axios.get(`${BASE_URL}/companies/${company}/categories/${category}/products`, {
            params: { top, minPrice, maxPrice },
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        return response.data.products;
    } catch (error) {
        console.error(`Error fetching data from ${company}:`, error);
        return [];
    }
};

// Generate a unique identifier for each product
const generateUniqueId = (product) => {
    return `${product.company}-${product.id}`;
};

// Endpoint to get top 'n' products within a category
app.get('/categories/:categoryname/products', async (req, res) => {
    const { categoryname } = req.params;
    let { n, page, sort, order, minPrice, maxPrice } = req.query;
    n = parseInt(n) || 10;
    page = parseInt(page) || 1;
    order = order === 'desc' ? -1 : 1;

    if (n > 10) {
        return res.status(400).send("Pagination required for more than 10 products per page.");
    }

    try {
        const companies = ['AMZ', 'FLP', 'SNP', 'MYN', 'AZO'];
        let products = [];

        for (let company of companies) {
            const data = await fetchData(company, categoryname, n, minPrice, maxPrice);
            products = products.concat(data);
        }

        // Generate unique IDs
        products = products.map(product => ({
            ...product,
            uniqueId: generateUniqueId(product)
        }));

        // Sort products if required
        if (sort) {
            products.sort((a, b) => (a[sort] > b[sort] ? 1 : -1) * order);
        }

        // Paginate results
        const startIndex = (page - 1) * n;
        const endIndex = startIndex + n;
        const paginatedProducts = products.slice(startIndex, endIndex);

        res.json({ products: paginatedProducts });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to get product details
app.get('/categories/:categoryname/products/:productid', async (req, res) => {
    const { categoryname, productid } = req.params;

    try {
        const companies = ['AMZ', 'FLP', 'SNP', 'MYN', 'AZO'];
        let productDetails = null;

        for (let company of companies) {
            const data = await fetchData(company, categoryname, 10, 0, 100000); // Assume a large price range to get all products
            productDetails = data.find(product => generateUniqueId(product) === productid);
            if (productDetails) break;
        }

        if (productDetails) {
            res.json(productDetails);
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).send('Internal Server Error');
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
