const Listing = require('../models/listing');
const getCoordinates = require("../utils/geocode");

//Index Route backend
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", {allListings});
};

//New Route
module.exports.renderNewForm = (req,res) => {
    res.render("listings/new")
};

//Show  Route
module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path: "reviews", populate: {path: "author"}}).populate("owner");
    if(!listing){
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render('listings/show', {listing});
};

//Create Route
module.exports.createListing = async (req, res) => {
    let listingData = req.body.listing;

    let url = req.file.path;
    let filename = req.file.filename;

    const geometry = await getCoordinates(
        listingData.location,
        listingData.country
    );

    const newListing = new Listing(listingData);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = geometry;

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

//Edit Route
module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/h_300,w_250");
    res.render('listings/edit', {listing, originalImageUrl});
};

//Update Route
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listingData = req.body.listing;

    //NEW: update coordinates if location or country changed
    const geometry = await getCoordinates(
        listingData.location,
        listingData.country
    );

    listingData.geometry = geometry;

    let listing = await Listing.findByIdAndUpdate(id, listingData);

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

//Delete Route
module.exports.destroyListing = async (req, res) => {
    let {id} = req.params;
    let deletedList = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted")
    res.redirect('/listings')
};