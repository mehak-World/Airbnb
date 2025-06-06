const express = require("express");
const app = express();
const PORT = 3000;
const mongoose = require("mongoose");
const path = require("path");
const Listing = require("./models/Listing");
const ejsMate = require("ejs-mate");
const ExpressError = require("./ExpressError.js");
const Review = require("./models/Review.js");
const listingRouter = require("./routes/listing.js");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const User = require("./models/User.js");
const bcrypt = require("bcrypt")
const {isLoggedIn, isAuthor} = require("./utils/middlewares.js")
require("dotenv").config()
const MongoStore = require('connect-mongo');

let db_url = `mongodb+srv://mehaknarang75419:${process.env.DB_PASS}@cluster0.6tuitqz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

main()
  .then(() => console.log("Successfully connected to the database"))
  .catch((err) => console.log(err));



async function main() {
  await mongoose.connect(db_url);
}

const store = MongoStore.create({
  mongoUrl: db_url,
  crypto: {
    secret: "mysecretkey"
  },
  touchAfter: 24*3600
})

store.on("error", () => {
  console.log("error in mongo session store", err);
})

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser("mysecretkey"));
app.set('trust proxy', 1);
app.use(
  session({
    store,
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
  })
);

app.use(flash());

app.use((req, res, next) => {
  console.log("Session middleware check:", req.session);
  res.locals.success = req.flash("success") || "";
  res.locals.error = req.flash("error") || "";
  if(req.session.userId){
    res.locals.loggedIn = true;
    res.locals.userId = req.session.userId;
  }
  else{
    res.locals.loggedIn = false;
  }
  next();
});

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.engine("ejs", ejsMate);

app.use("/listings", listingRouter);

// Add review route
app.post("/listings/:id/reviews", isLoggedIn, async (req, res) => {
  try {
    const id = req.params.id;
    const { rating, comment } = req.body;
    const listing = await Listing.findById(id);
    // Create a review
    const review = new Review({ rating, comment });
    review.author = req.session.userId;
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
  "/listings/:listing_id/reviews/:review_id/delete", isLoggedIn, isAuthor,
  async (req, res) => {
    const { listing_id, review_id } = req.params;
    const listing = await Listing.findById(listing_id);
    let idx = listing.reviews.indexOf(review_id);
    delete listing.reviews[idx];
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
      res.redirect("/login");
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
    console.log(req.session);
    req.flash("success", "Welcome " + username)
    res.redirect("/listings");
} else {
    // Passwords don't match, authentication failed
    console.log('Passwords do not match! Authentication failed.');
    req.flash("error", "Incorrect credentials")
    res.redirect("/login");
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

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Could not log out.");
    }
    res.clearCookie("connect.sid"); // Optional: clears cookie from browser
    res.redirect("/login"); // or res.send("Logged out")
  });
});


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
