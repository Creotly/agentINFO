const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from a .env file

const app = express();
const port = 3000;

const cors = require('cors');

// Enable CORS for all routes
app.use(cors());

app.use(express.json());

// Root route to confirm backend is working
app.get('/', (req, res) => {
    res.send('Backend is working!');
});

// Fact-check route
app.post('/fact-check', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).send('Query is required');
    }

    try {
        const response = await axios.get(
            `https://factchecktools.googleapis.com/v1alpha1/claims:search`, // Correct API endpoint
            {
                params: {
                    query: query,
                    key: process.env.GOOGLE_API_KEY, // Use your Google API key
                },
            }
        );

        // Extract relevant information (e.g., textualRating or explanation)
        if (response.data.claims && response.data.claims.length > 0) {
            // Get the first claim
            const claim = response.data.claims[0];

            // Check if textualRating exists
            const textualRating =
                claim.claimReview && claim.claimReview[0]
                    ? claim.claimReview[0].textualRating
                    : null;

            const explanation =
                claim.claimReview && claim.claimReview[0]
                    ? claim.claimReview[0].url || 'No additional explanation provided'
                    : null;

            // If textualRating is found, return it as plain text
            if (textualRating) {
                return res.send(`"${textualRating}: ${explanation}"`);
            } else {
                return res.status(404).send('No fact-checking data available');
            }
        } else {
            return res.status(404).send('No claims found for the provided query');
        }
    } catch (error) {
        console.error('Error fetching fact-check data:', error.message);
        res.status(500).send('No verdict for this query yet!');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
