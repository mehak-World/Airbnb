const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing");
const schema = require("../utils/SchemaValidation.js")


// Middleware to validate schema
const validateSchema = (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return next(error); 
  }
  next();
};

// Index route
router.get("/", async (req, res, next) => {
    // Find all the listings from the database
    try{
      const listings = await Listing.find({});
      console.log(listings);
      res.render("Listings/index.ejs", {listings});
    }
    catch(err){
        next(err);
    }
})

// New route
router.get("/new", (req, res) => {
  res.render("Listings/create.ejs")
})

// Show route
router.get("/:id", async (req, res, next) => {
  try{
      const id = req.params.id;
      const listing = await Listing.findById(id).populate('reviews');
      console.log(listing);
      res.render("Listings/show.ejs", {listing})
  }
  catch(err){
      next(err)
  }
  
})

// Create route
router.post("/", validateSchema, async (req, res, next) => {
  try{
    console.log("Req body" , req.body);
    const {title, description, price, image, location, country} = req.body;
    const listing = new Listing({title, description, price, image, location, country});
    const newListing = await listing.save();
    console.log(newListing);
    req.flash("success", "New listing has been created");
    res.redirect("/listings");
  }
  catch(err){
    next(err)
  }
})


// Edit route
router.get("/:id/edit", async (req, res, next) => {
  try{
      const listing = await Listing.findById(req.params.id)
      res.render("Listings/edit.ejs", {listing})
  }
  catch(err){
    next(err)
  }
})

// Update route
router.post("/:id/", validateSchema, async (req, res, next) => {

  try{
    const {id} = req.params;
    console.log(req.body);
    const updatedListing = await Listing.findByIdAndUpdate(id, req.body, {new: true});
    console.log("Updated", updatedListing);
    req.flash("success", "Listing has been updated")
    res.redirect("/listings/" + id );
  }

  catch(err){
    next(err)
  }
    
})

// Delete route
router.post("/:id/delete", async (req, res, next) => {
  try{
    const {id} = req.params;
    const deletedList = await Listing.findByIdAndDelete(id);
    console.log(deletedList);
    res.redirect("/listings")
  }

  catch(err){
    next(err);
  }
})

module.exports = router
