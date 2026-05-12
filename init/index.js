// const mongoose = require('mongoose');
// const initData = require('./data.js');
// const Listing = require('../models/listing.js')

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
// main().then(() => {
//     console.log("Connected to DB");
// })
// .catch((err) => {
//     console.log(err);
// })

// async function main(){
//     await mongoose.connect(MONGO_URL);
//     console.log("Connected to DB");
//     await initDB();
// }

// const initDB = async () => {
//     await Listing.deleteMany({});
//     initData.data = initData.data.map((obj) => ({ ...obj, owner: "69fc22e24e7a3f0e8ce771af"}));
//     await Listing.insertMany(initData.data);
//     console.log("Data was intialized");
// }


const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const axios = require("axios");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);
  await initDB();
}

// ⏳ delay helper (prevents rate limit)
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// 🔁 retry-safe geocoding function
const fetchCoords = async (query, retries = 3) => {
  try {
    return await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          format: "json",
          limit: 1,
        },
        headers: {
          "User-Agent":
            "WanderLustApp/1.0 (contact: your_email@gmail.com)",
          "Accept-Language": "en",
        },
      }
    );
  } catch (err) {
    if (retries > 0) {
      console.log(`Retrying for: ${query}`);
      await sleep(2000);
      return fetchCoords(query, retries - 1);
    }
    throw err;
  }
};

const initDB = async () => {
  await Listing.deleteMany({});

  const ownerId = "69fc22e24e7a3f0e8ce771af";

  for (let obj of initData.data) {
    let geometry = {
      type: "Point",
      coordinates: [0, 0],
    };

    try {
      const response = await fetchCoords(
        `${obj.location}, ${obj.country}`
      );

      if (response.data && response.data.length > 0) {
        geometry = {
          type: "Point",
          coordinates: [
            parseFloat(response.data[0].lon),
            parseFloat(response.data[0].lat),
          ],
        };
      } else {
        console.log(`No coords found for ${obj.location}`);
      }

      const listing = new Listing({
        ...obj,
        owner: ownerId,
        geometry,
      });

      await listing.save();
      console.log(`${obj.location} added`);

    } catch (err) {
      console.log(`Error for ${obj.location}:`, err.message);
    }

    // ⛔ IMPORTANT: respect API limits
    await sleep(1200);
  }

  console.log("Database initialized successfully");
};