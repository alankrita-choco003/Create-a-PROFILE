const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const bcrypt = require('bcrypt');
const cookieParser =require('cookie-parser');
const jwt= require("jsonwebtoken");

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", function(req,res) {
    res.render("index");
});

app.get('/login',(req,res)=>{
    res.render("login");
});

app.get("/profile",isLoggedIn,async (req,res)=>{
    let user = await userModel.findOne({email: req.user.email}).populate("posts");
    res.render("profile",{user});
});

app.get("/like/:id",isLoggedIn,async (req,res)=>{
    let post = await postModel.findOne({_id: req.params.id}).populate("user");

    if (post.likes.indexOf(req.user.userid.toString()) === -1) {
    post.likes.push(req.user.userid);
} else {
    post.likes.splice(post.likes.indexOf(req.user.userid.toString()), 1);
}


   
    await post.save();
    res.redirect("/profile");
});

app.get("/edit/:id",isLoggedIn,async (req,res)=>{
    let post = await postModel.findOne({_id: req.params.id}).populate("user");

     res.render("edit", { post }); 
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
    await postModel.findByIdAndUpdate(req.params.id, { content: req.body.content });
    res.redirect("/profile");
});


app.post("/post", isLoggedIn, async (req,res)=>{
    let user = await userModel.findOne({email: req.user.email});
    let {content} = req.body;

  let post = await postModel.create({
    user: user._id,
    content
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

app.post("/register",async function(req,res) {
    let {email, password, username, name, age}= req.body;

    let user = await userModel.findOne({email});
    if(user) return res.status(500).send("User already registered");

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,async(err,hash)=>{
           let user = await userModel.create({
            username,
            email,
            age,
            name,
            password: hash
           });

          let token =jwt.sign({email: email, userid: user._id},"shhhh");
          res.cookie("token",token);
          res.send("registered");
        })
    })
    
});


app.post("/login",async function(req,res) {
    let {email, password}= req.body;

    let user = await userModel.findOne({email});
    if(!user) return res.status(500).send("Something Went Wrong");

    bcrypt.compare(password, user.password, function(err, result){
        if(result){
           
        let token = jwt.sign({email: email, userid: user._id},"shhhh");
        res.cookie("token",token);
         res.status(200).redirect("/profile");
        }
        else res.redirect("/login");
    })
        });

app.get("/logout",(req,res) => {
    res.cookie("token","");
    res.redirect("/login");
});

function isLoggedIn(req,res,next){
    if(req.cookies.token==="") res.redirect("/login");
    else{
        let data = jwt.verify(req.cookies.token,"shhhh");
        req.user = data;
    }
    next();
}

// app.get("/create", async function(req,res) {
//     let user = await userModel.create({
//     username : "Alankrita",
//     email: "alankritachakraborty@gmail.com",
//     age: 21,
//     });


    
// res.send(user);
   
// })

// app.get("/post/create", async function(req,res) {
// let post = await postModel.create({
//     postdata: "hello saare log kaise ho",
//     user: "6887d8d607709085873159a8",
// })

// let user = await userModel.findOne({_id: "6887d8d607709085873159a8"});
// user.posts.push(post._id);
// await user.save();
// res.send({post,user});

// })



app.listen(3000);