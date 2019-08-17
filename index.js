const express = require('express');
const app = express();
const fetch=require("node-fetch")
const request = require("request");
const fs = require('fs');
const bodyParser = require('body-parser');//for response body reading
var cookieParser = require('cookie-parser');
 
const session = require("express-session");

const passport=require("passport");
const LocalStrategy = require('passport-local').Strategy;

const bcrypt=require('bcrypt');
const saltRonds=10;


var $=require('jquery');
require('dotenv').config();

let ejs = require('ejs');

const mongoose = require('mongoose');

app.use(bodyParser.urlencoded({ extended: true }));//show the body res
app.use(cookieParser());

app.use(express.static('public'));//search static files(pics and css) in 'public' folder

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    //cookie: { secure: true }
  }))


  app.use(passport.initialize());
  app.use(passport.session());




  //check loging in to json before direction 
  passport.use(new LocalStrategy(
    {usernameField: 'manager'},
      function(manager, password, done) {
      console.log("vcsd", manager,password);

      fs.readFile("users.json","utf8",function(err,data){
        let j_users=JSON.parse(data);//to json
        let arr=j_users.m;
        var item = arr.find(item => item.manager == manager);

        console.log(item);
        if(item===undefined)  return done(null, false);

        const hashed=item.password;

        bcrypt.compare(password,hashed,function(err,response){
            if(response===true)
            {
                return done(null, item);
    
            }
            else
            {
                return done(null, false);
    
            }
        });


      
      });
 }));


 app.use(function(req,res,next){
    res.locals.isAuthenticated=req.isAuthenticated();
    console.log(res.locals.isAuthenticated);
    next();
 });

  
//connect mongodb
mongoose.connect('mongodb+srv://'+process.env.USER_N+':'+process.env.USER_P+'@cluster0-ngaul.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true });
const db = mongoose.connection;

db.on('error', (error) => console.log('db connection err'))
db.once('open', () => console.log('connected to mongo db'))



//home page
app.get('/', function (req,res) {//load home page
    res.render('maker.ejs',{isAuthenticated:res.locals.isAuthenticated});
});



let jsres;//week movie list
let c_jsres={nor:1};

app.get('/maker', async function (req,res) {//load time list home page
let dd=new Date();

TimeS = mongoose.model("nTime", ntimeSchem);

let prev;
let prom=[];
for (let i=0;i<7;i++){
prev=dd.getDate();
prom.push(TimeS.find({'date':dd.toDateString()}).sort({'hour':1}));
dd.setDate(1+prev);

}

Promise.all(prom)
.then((result)=>{
jsres=Object.assign(c_jsres,result);
// console.log(result);
});
res.send(JSON.stringify(jsres));

});






function authenticationMiddleware() {  //before each req to management rout
    return (req, res, next) => {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

        if (req.isAuthenticated()) return next();
        res.redirect('/')
    }
}



app.get('/signUp',authenticationMiddleware(), function (req,res) {//load sign manager page
    console.log(req.user);
    console.log(req.isAuthenticated);
    res.render('signUp.ejs');
});





app.post('/signUp', function (req,res,next) {//chek and add new manager
    let new_m=req.body;
    if(new_m.code==process.env.M_CODE){//save new
        bcrypt.hash(new_m.password,saltRonds, function(error,hash){

            fs.readFile("users.json","utf8",function(err,data){
            let j_users=JSON.parse(data);//to json
            let arr=j_users.m;
            let jsonData={'manager': new_m.manager,'password':hash,'code':arr[arr.length-1].code+1}
            j_users.m.push(jsonData);
            fs.writeFileSync("users.json",JSON.stringify(j_users));

            let co=arr[arr.length-1].code;
            console.log(co);
                req.login(co, function(err) {
                    console.log(req.session);
                    if (err) { return res.redirect('/err'); }
                    return res.redirect('/manager');
                    // res.end();

                });
            });
        });

    }
    else{//wrong code
        res.redirect('/err');

    }
// console.log(req.body);
// 
});



passport.serializeUser(function(co, done) {
    done(null, co);
  });
  
  passport.deserializeUser(function(co, done) {
      done(null, co);
    });










 app.get('/login-manager',function(req,res){
    res.render('loginM.ejs');

 });

app.post('/login-manager', passport.authenticate(
    'local',{successRedirect:'/manager' 
            ,failureRedirect:'/movies'}));//load login page





app.use('/manager',authenticationMiddleware(),  (req,res) => {//load manager home page need chek
        res.render('manager.ejs');
});






app.get('/logout', (req, res, next) => {
    req.logout();
    // req.session.destroy( () => {
    //     res.clearCookie('connect.sid');
    //     res.redirect('/');
    // });
    res.redirect('/');
});
 











app.get('/movies', function (req, res) {//load movies page
        // if (error) {
        //     Console.log('error movies');
        // } else {
            res.render('movies.ejs');
        // }

});

app.get('/movies/list', function (req, res) {//load movies page
    Movie.find({}, function (error, data) {
        if (error) {
            console.log('error movies');
        } else {
            // console.log(data);

            res.json(data);
        }
    });
});










//movies

let moviesSchem = new mongoose.Schema({//mongoose schema=table
    movie: String,
    lang: String,
    date: String,
    //status:String//-->bool
    imgs:String,
    Limgs:String,
    vids:String
});

let Movie = mongoose.model("Movie", moviesSchem);//mongoos cell object

app.get('/newMovie',authenticationMiddleware(), function (req, res) {//load new movie page
    res.render('newMovie.ejs');
});






app.post('/newMovie',authenticationMiddleware(), function (req, res) {
    console.log(req);

    let data= req.body;
    // console.log(data);
    

    Movie.create({
        movie: data.movie,
        lang: data.lang,
        date: data.date,
        imgs: data.imgs,
        Limgs: data.Limgs,
        vids: data.vids
        //status=data.status
    }, function (error, data) {
        if (error) {
            console.log('error adding movie');
            res.redirect('/err');
            
        } else {
            console.log('data added');
            // console.log(data);
            res.redirect('/movies');
            
        }
    });
    
    
});//add movie rute




//stages


let stagesSchem = new mongoose.Schema({//mongoose schema=table
    stage: String,
    seats: Number,
    more: String
});

let Stage = mongoose.model("Stages", stagesSchem);//mongoos cell object

app.get('/stages',authenticationMiddleware(), function (req, res) {//load 'new stage' page
res.render('stages.ejs');
});


app.post('/stages',authenticationMiddleware(), function (req, res) {
    let data = req.body;
    console.log(data);
    
    
    Stage.create({
        stage: data.stage,
        seats: data.seats,
        more: data.more
    }, function (error, data) {
        if (error) {
            console.log('error adding stage');
            res.redirect('/err');
            
        } else {
            console.log('data added');
            // console.log(data);
            res.redirect('/');
            
        }
    });
    
    
});//add stage rute







// app.get('/calendar',authenticationMiddleware(), function (req, res) {//load 'new stage' page
// res.render('calendar.ejs');
// });



let ntimeSchem = new mongoose.Schema({//mongoose schema=table
    date: String,
    hour: String,
    movie: String,
    stage:String

});
let TimeS = mongoose.model("nTime", ntimeSchem);




app.post('/calendar/add',authenticationMiddleware(), function (req, res) {//add time schdoual
    let addata=req.query;
    TimeS = mongoose.model("nTime", ntimeSchem);
     
        TimeS.create({
            date: addata.date,
            hour: addata.time,
            movie: addata.movie,
            stage:addata.stage
        }, function (error, addata) {
            if (error) {
                res.send('error adding stage');
                
                
            }else{
                res.send('work!');
            }
            
        });

    });

    app.get('/calendar/time',authenticationMiddleware(), function (req, res) {//time check request
        let data=req.query;
        let dd=new Date(data.date).toDateString();
        TimeS = mongoose.model("nTime", ntimeSchem);
        // let prom=
        TimeS.find({'movie': data.movie,'stage':data.stage,'date':dd})
        .sort({'hour':1})
        .exec(function(error, movieP) {
            if (error) 
            {
                console.log('error movies');
            } 
            else 
            {
                res.send(JSON.stringify(movieP));
                
            }
        });
    });
    //     Promise(prom) 
    //     .then((result)=>{
    //         res.send(JSON.stringify(result));

    //     });
    // });








    app.get('/stageMovies',authenticationMiddleware(), (req, res) => {//load 'new stage' page
    res.render('moviesToStage.ejs');
    });


// //movies for stage
// let stagesMoviesSchem = new mongoose.Schema({//mongoose schema=table
//     movie: String,
//     stage: String,
//     date: String
// });

// let StageMovie = mongoose.model("StageMovies", stagesMoviesSchem);//mongoos cell object




// app.post('/stageMovies', function (req, res) {
//     let data = req.body;
//     console.log(data);
    
    
//     StageMovie.create({
//         movie: data.movie,
//         stage: data.stage,
//         date: data.date
//     }, function (error, data) {
//         if (error) {
//             console.log('error adding stage');
//             res.redirect('/err');
            
//         } else {
//             console.log('data added');
//             console.log(data);
//             res.redirect('/');
            
//         }
//     });
    
    
// });//add movie time send to db










//get stages list
app.get('/stageMovies/search',authenticationMiddleware(), (req,res) => {
    let list=req.query.list;

    switch (list){
        case 'stage':
            Stage = mongoose.model("stages", stagesSchem);
            Stage.find({}, function (error, stageP) {
               if (error) 
              {
                   console.log('error stages');
              } 
              else 
               {
                //   console.log(stageP);
                  res.send(JSON.stringify(stageP));
            
                }
           }).sort({'hour':1});
           break;
    case 'movie':
        Movie = mongoose.model("Movie", moviesSchem);
            Movie.find({}, function (error, movieP) {
                if (error) 
                {
                    console.log('error movies');
                } 
                else 
                {
                    res.send(JSON.stringify(movieP));
                    
                }
            });
            break;
    }
});




// get movies list
// app.get('/stageMovies/movie',function(req,res){
//     Movie = mongoose.model("Movie", moviesSchem);
//     Movie.find({}, function (error, movieP) {
//         if (error) 
//         {
//             console.log('error movies');
//         } 
//         else 
//         {
//             res.send(JSON.stringify(movieP));
            
//         }
//     });
// });
// // get stages list
// app.get('/stageMovies/stage',function(req,res){
//     Stage = mongoose.model("stages", stagesSchem);
//        Stage.find({}, function (error, stageP) {
//         if (error) 
//         {
//             console.log('error stages');
//         } 
//         else 
//         {
//             console.log(stageP);
//             res.send(JSON.stringify(stageP));
    
//         }
//       });

//     });





// app.get("/search", function (req, res) {
//      request("https://pixabay.com/api/videos, function (error, response, body) {
//     if (error) {
//     console.log(error);
//     } 
//     else
//     {
//         console.log(response);
//      var data = JSON.parse(body);
//     res.render("videos.ejs", {
//         vidsData: data
//     });
//     console.log(data[0]);
    
// }
// });
// });

const API_KEY =process.env.API_PIXA;

app.get("/search/i",authenticationMiddleware(),async (request,response)=>{
    let s_term=request.query.img;
    // const URL = "https://pixabay.com/api/?key="+API_KEY+"&q="+s_term;
let fet= await fetch("https://pixabay.com/api/?key="+API_KEY+"&q="+s_term);
const json=await fet.json();
response.json(json);
// response.end();
});

app.get("/search/v",authenticationMiddleware(),async (request,response)=>{
    let s_term=request.query.vid;
    // const URL = "https://pixabay.com/api/videos/?key="+API_KEY+"&q="+s_term;
let fet= await fetch("https://pixabay.com/api/videos/?key="+API_KEY+"&q="+s_term);
const json=await fet.json();
response.json(json);
// response.end();
});

app.get('/*', function (req, res) {//load err page
    res.render('errPage.ejs');
});


app.listen('3000', function() {
    console.log('started');
});

