const axios = require("axios");

async function getCoordinates(location, country) {
    try {
        const response = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
                params: {
                    q: `${location}, ${country}`,
                    format: "json",
                    limit: 1
                },
                headers: {
                    "User-Agent": "WanderLustApp"
                }
            }
        );

        if (response.data && response.data.length > 0) {
            return {
                type: "Point",
                coordinates: [
                    parseFloat(response.data[0].lon),
                    parseFloat(response.data[0].lat)
                ]
            };
        }

        // fallback if not found
        return {
            type: "Point",
            coordinates: [0, 0]
        };

    } catch (err) {
        console.log("Geocoding error:", err.message);

        return {
            type: "Point",
            coordinates: [0, 0]
        };
    }
}

module.exports = getCoordinates;