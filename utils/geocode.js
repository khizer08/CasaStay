const axios = require("axios");

// map part
module.exports.getCoordinates = async (location, country) => {
    const geoResponse = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
            params: {
                q: `${location}, ${country}`,
                format: "json",
                limit: 1
            },
            headers: {
                "User-Agent": "CasaStay-App"
            }
        }
    );

    if (!geoResponse.data || geoResponse.data.length === 0) {
        return null;
    }

    return {
        lat: parseFloat(geoResponse.data[0].lat),
        lng: parseFloat(geoResponse.data[0].lon)
    };
};