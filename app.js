const express = require("express");
const app = express();
const PORT = 3000;
const mongoose = require("mongoose");
const path = require("path");
const Listing = require("./models/Listing");
const ejsMate = require("ejs-mate");
const ExpressError = require("./ExpressError.js");
const schema = require("./utils/SchemaValidation.js");
const Review = require("./models/Review.js");
const listingRouter = require("./routes/listing.js");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const User = require("./models/User.js");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

main()
  .then(() => console.log("Successfully connected to the database"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/airbnb_proj");
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser("mysecretkey"));
app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: {
    secure: false, // true only if using HTTPS
    httpOnly: true
  }
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success") || "";
  res.locals.error = req.flash("error") || "";
  next();
});

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.engine("ejs", ejsMate);

app.use("/listings", listingRouter);

// Add review route
app.post("/listings/:id/reviews", async (req, res) => {
  try {
    const id = req.params.id;
    const { rating, comment } = req.body;
    const listing = await Listing.findById(id);
    // Create a review
    const review = new Review({ rating, comment });
    const savedRev = await review.save();
    listing.reviews.push(savedRev._id);
    await listing.save();
    res.redirect("/listings/" + id);
  } catch (err) {
    throw new ExpressError(err.status, err.message);
  }
});

// Delete review
app.post(
  "/listings/:listing_id/reviews/:review_id/delete",
  async (req, res) => {
    const { listing_id, review_id } = req.params;
    const listing = await Listing.findById(listing_id);
    let idx = listing.reviews.indexOf(review_id);
    delete listing[idx];
    await listing.save();
    await Review.findByIdAndDelete(review_id);
    res.redirect("/listings/" + listing_id);
  }
);

// Login page
app.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

// Signup route
app.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

// Signup user
app.post("/signup", async (req, res, next) => {
  const { username, password } = req.body;
  const saltRounds = 10;

  try {
    const user = await User.findOne({ username });

    if (user) {
      req.flash("error", "The user already exists");
      return res.redirect("/signup");
    }

    const hash = await bcrypt.hash(password, saltRounds);
    const new_user = new User({ username, password: hash });
    const saved_user = await new_user.save();

    req.session.userId = saved_user._id;
    console.log(req.session);
    req.flash("success", "You have successfully signed up")
    res.redirect("/listings"); 

  } catch (err) {
    console.error(err);
    next(new Error("Something went wrong during signup."));
  }
});

// Login user
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try{
    const user = await User.findOne({ username });
    if(!user){
      req.flash("error", "No such user exists");
    }
    else{
      // Verify the password
      bcrypt.compare(password, user.password, (err, result) => {
    if (err) {
        // Handle error
        console.error('Error comparing passwords:', err);
        return;
    }

if (result) {
    // Passwords match, authentication successful
    console.log('Passwords match! User authenticated.');
    req.session.userId = user._id;
    req.flash("success", "Welcome " + username)
    res.redirect("/listings");
} else {
    // Passwords don't match, authentication failed
    console.log('Passwords do not match! Authentication failed.');
}
});
    }
  }
  catch(err){
    next(err)
  }
})


app.get("/test-route", (req, res) => {
  console.log(req.session);
  res.send(req.session)
})

// Error handling middleware
app.use((err, req, res, next) => {
  const { status = 500, message = "An error occured" } = err;
  console.log("Error middleware");
  console.log(err);
  res.status(status).send(message);
});

app.listen(PORT, () => {
  console.log("The server is listening");
});
