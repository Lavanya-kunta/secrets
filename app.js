//jshint esversion:6

require('dotenv').config();
const express=require('express');
const bodyParser=require('body-parser');
const ejs=require('ejs');
const mongoose=require('mongoose');
//const encrypt=require("mongoose-encryption");
//const md5=require("md5"); to increse mo security use bcrypt instead of md5       |i forgot to commit in git   level3 security
const bcrypt=require("bcrypt");
const saltRounds=10;


const app=express();

//console.log(md5("123456"));  //hash pasword      level3 security

//console.log(process.env.API_KEY);                 ""

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended:true
}));


mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true});

/*const userSchema={
  email:String,
  password:String
};*/
const userSchema= new mongoose.Schema({
  email:String,
  password:String
});
//const secret="Thisisourlittlesecrete.";
//userSchema.plugin(encrypt,{secret:secret, encryptFields:["password"]});
//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

const User=new mongoose.model('User',userSchema);

app.get("/",function(req,res){
  res.render("home");
});
app.get("/login",function(req,res){
  res.render("login");
});
app.get("/register",function(req,res){
  res.render("register");
});



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





app.listen(3000,function(){
  console.log("server started on port no 3000");
})
