const Listing = require("../models/Listing");
const Review = require("../models/Review");

const isLoggedIn = (req, res, next) => {
      if(req.session.userId){
        next();
      }
      else{
        req.flash("error", "You must be logged in to perform this action")
        res.redirect("/login");
      }
}

const isOwner = async (req, res, next) => {
  const {id} = req.params;
  const listing = await Listing.findById(id);
  if(listing.owner == req.session.userId){
    next();
  }
  else{
    req.flash("error", "You do not own this listing");
    res.redirect("/listings/" + id);
  }
}

const isAuthor = async (req, res, next) => {
   const {listing_id, review_id} = req.params;
  const review = await Review.findById(review_id);
  if(review.author == req.session.userId){
    next();
  }
  else{
    req.flash("error", "You are not author of this review");
    res.redirect("/listings/" + listing_id);
  }
}

module.exports = {isLoggedIn, isOwner, isAuthor}