const express = require("express")
const app = express();
const PORT = 3000;
const mongoose = require("mongoose");
const path = require("path");
const Listing = require("./models/Listing");
const ejsMate = require("ejs-mate");
const ExpressError = require("./ExpressError.js")
const schema = require("./utils/SchemaValidation.js")

main().then(() => console.log("Successfully connected to the database") ).catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/airbnb_proj');
}

app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public"))); 
app.engine("ejs", ejsMate);

// Middleware to validate schema
const validateSchema = (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return next(error); 
  }
  next();
};


// Index route
app.get("/listings", async (req, res, next) => {
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
app.get("/listings/new", (req, res) => {
  res.render("Listings/create.ejs")
})

// Show route
app.get("/listings/:id", async (req, res, next) => {
  try{
      const id = req.params.id;
  const listing = await Listing.findById(id);
  res.render("Listings/show.ejs", {listing})
  }
  catch(err){
      next(err)
  }
  
})

// Create route
app.post("/listings", validateSchema, async (req, res, next) => {
  try{
    console.log("Req body" , req.body);
    const {title, description, price, image, location, country} = req.body;
    const listing = new Listing({title, description, price, image, location, country});
    const newListing = await listing.save();
    console.log(newListing);
    res.redirect("/listings");
  }
  catch(err){
    next(err)
  }
})

// Edit route
app.get("/listings/:id/edit", async (req, res, next) => {
  try{
const listing = await Listing.findById(req.params.id)
  res.render("Listings/edit.ejs", {listing})
  }
  catch(err){
    next(err)
  }
  
})

// Update route
app.post("/listings/:id/", validateSchema, async (req, res, next) => {

  try{
    const {id} = req.params;
    console.log(req.body);
    const updatedListing = await Listing.findByIdAndUpdate(id, req.body, {new: true});
    console.log("Updated", updatedListing);
    res.redirect("/listings/" + id );
  }

  catch(err){
    next(err)
  }
    
})

// Delete route
app.post("/listings/:id/delete", async (req, res, next) => {
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

// Error handling middleware
app.use((err, req, res, next) => {
  const {status = 500, message = "An error occured"} = err;
  console.log("Error middleware")
  console.log(err)
  res.status(status).send(message)

})

app.listen(PORT, () => {
    console.log("The server is listening");
})