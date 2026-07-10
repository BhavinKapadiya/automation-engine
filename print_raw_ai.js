require('dotenv').config();
const { shopifyApi, ApiVersion, Session } = require('@shopify/shopify-api');
const { OpenAI } = require('openai');
require('@shopify/shopify-api/adapters/node');

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES.split(','),
  hostName: process.env.HOST.replace(/https?:\/\//, ''),
  apiVersion: ApiVersion.April26,
  isEmbeddedApp: false,
});

const session = new Session({
  id: `offline_${process.env.SHOP_URL}`,
  shop: process.env.SHOP_URL,
  state: 'offline',
  isOnline: false,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
});

const client = new shopify.clients.Graphql({ session });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const query = `
  query getProduct {
    product(id: "gid://shopify/Product/8621563674915") {
      id
      title
      descriptionHtml
      vendor
      productType
      tags
      variants(first: 1) {
        edges {
          node {
            sku
          }
        }
      }
    }
  }
`;

async function testRawAI() {
  const res = await client.request(query);
  const product = res.data.product;
  const sku = product.variants.edges[0]?.node?.sku || '';

  const { analyzeProductWithAI } = require('./enricher');
  const aiData = await analyzeProductWithAI(openai, product, sku);
  console.log('RAW JSON KEYS RETURNED BY AI:', Object.keys(aiData));
  console.log('RAW JSON CONTENT:', JSON.stringify(aiData, null, 2));
}

testRawAI();
