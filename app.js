//jshint esversion:6

require('dotenv').config();
const express=require('express');
const bodyParser=require('body-parser');
const ejs=require('ejs');
const mongoose=require('mongoose');
//const encrypt=require("mongoose-encryption");
//const md5=require("md5"); //to increse mo security use bcrypt instead of md5       |i forgot to commit in git   level3 security
//const bcrypt=require("bcrypt");    //level-4
//const saltRounds=10;          //level-4

//1 step
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require('mongoose-findorcreate');


const app=express();

//console.log(md5("123456"));  //hash pasword      level3 security

//console.log(process.env.API_KEY);                 ""

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended:true
}));


//express-session setup    2 step
app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized:false
}));


//step3
app.use(passport.initialize());
app.use(passport.session())


mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true});

/*const userSchema={
  email:String,
  password:String
};*/
const userSchema= new mongoose.Schema({
  email:String,
  password:String,
  googleId:String
});
//const secret="Thisisourlittlesecrete.";
//userSchema.plugin(encrypt,{secret:secret, encryptFields:["password"]});
//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

//step4
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User=new mongoose.model('User',userSchema);

//step5
passport.use(User.createStrategy());

//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());
//above lines replaced by below code it works for all not only fir local
/*passport.serializeUser(function(user, done) {
  done(null,user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id,function(err,user)
    done(err,user);
  });
});*/

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});





//this part copy from passport-google-oauth20  clientid,clientsecret created fro google developer console by creating project, url copy ffrom callback url in project secrets
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  //  userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"  ,  //copied from google+ deprecations  account github
  //  passReqToCallback:true
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));




app.get("/",function(req,res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google",{scope:["profile"]})       //google provides id and profile to identify in future   this line enough for sign into google account
);
app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });


app.get("/login",function(req,res){
  res.render("login");
});
app.get("/register",function(req,res){
  res.render("register");
});

//step7 secrets page creation
app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }
  else{
    res.redirect("/login");       //forcefully login
  }
});


/*app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});*/
app.get("/logout",function(req,res){
  req.session.destroy(function(err){
      res.redirect("/");
  });
});




//step6
app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login",function(req,res){
  const user=new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user,function(err){
    if(err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});











/*   //level-4

app.post("/register",function(req,res){
  bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    const newUser=new User({
      email:req.body.username,
      //password:md5(req.body.password)   //level3 security
      password:hash
    });
    newUser.save(function(err){
      if(err){
        console.log(err);
      }
      else{
        res.render("secrets")
      }
    });
  });

});

app.post("/login",function(req,res){
  const username=req.body.username;
  //const password=md5(req.body.password);   level 3 security
  const password=req.body.password;
  User.findOne({email:username},function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        //if(foundUser.password===password){
          //res.render("secrets");
        //}
        bcrypt.compare(password,foundUser.password,function(err,result){
          if(result===true){
            res.render("secrets");
          }
        })
      }
    }
  });
});
*/





app.listen(3000,function(){
  console.log("server started on port no 3000");
})
