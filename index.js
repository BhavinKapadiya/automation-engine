require('dotenv').config();
const express = require('express');
const { shopifyApi, ApiVersion, LogSeverity } = require('@shopify/shopify-api');
require('@shopify/shopify-api/adapters/node');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Shopify API client
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES.split(','),
  hostName: process.env.HOST.replace(/https?:\/\//, ''),
  apiVersion: ApiVersion.April26,
  isEmbeddedApp: false, // We are a standalone automation engine, not an embedded admin app
  logger: {
    level: LogSeverity.Info,
  },
});

app.get('/', (req, res) => {
  res.send('Track Auto Automation Engine is running.');
});

// OAuth: Step 1 - Begin Auth
app.get('/auth', async (req, res) => {
  try {
    const shop = req.query.shop;
    if (!shop) {
      return res.status(400).send('Missing shop parameter.');
    }
    await shopify.auth.begin({
      shop: shopify.utils.sanitizeShop(shop, true),
      callbackPath: '/auth/callback',
      isOnline: false, // We want an offline access token for background automation
      rawRequest: req,
      rawResponse: res,
    });
  } catch (error) {
    console.error('Error starting OAuth:', error);
    res.status(500).send(error.message);
  }
});

// OAuth: Step 2 - Callback
app.get('/auth/callback', async (req, res) => {
  try {
    const callbackResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callbackResponse;
    console.log('App Installed Successfully!');
    console.log('Offline Access Token:', session.accessToken);
    console.log('Save this access token to query the Shopify API.');
    
    // In a real production app, save the session to a database here
    res.send('App installed successfully! Check the server logs for the access token.');
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).send(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`To install the app, navigate to: http://localhost:${PORT}/auth?shop=${process.env.SHOP_URL}`);
});
