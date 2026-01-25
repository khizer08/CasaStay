const mongoose=require("mongoose");
const Schema=mongoose.Schema;// just so that we need to write "mongoose.Schema" often.
const Review=require("./review.js");


const listingSchema=new Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    image:{
        url:String,
        filename:String,
    },
    price:{
        type:Number
    },
    location:{
        type:String
    },
    country:{
        type:String
    },

    //map integration
    lat: {
    type: Number,
    required: function () {
        return this.location && this.country;
    }
    },
    lng: {
    type: Number,
    required: function () {
        return this.location && this.country;
    }
    },
    //till here.

    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref:"Review",
        },
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
});

listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
        await Review.deleteMany({_id:{$in: listing.reviews}});
    }
});

const Listing=mongoose.model("Listing",listingSchema);
module.exports=Listing;