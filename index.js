import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import bodyParser from "body-parser";


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded( { extended: true } ));

var flag = 0 // more than 1 password cannot be issued to a user

const db1 = mongoose.createConnection("mongodb://localhost:27017/loginDB", { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect("mongodb://localhost:27017/loginDB").then(() => {
//     console.log("App succesfully connected to database.");
// })
// .catch((error) => {
//     console.error(error);
// });

// const uri


const loginSchema = new mongoose.Schema({
    key: String
})

const Login = mongoose.model("Login", loginSchema);


app.listen(port, () => {
    console.log(`Server listening on ${port}.`)
})

app.get("/", (req, res) => {
    res.render("index.ejs");
})

app.post("/", async(req, res) => {
    res.render("index.ejs", { pw: req.body.key })
})

app.post("/login", async (req, res) => {
    var message = "";
    var toBeSent = "";
    if (flag == 1) {
        message = "You are already logged in. ";
        toBeSent = req.body.userid;
        res.render("index.ejs", { message: message, pw: toBeSent });
    } else {
        const entered = req.body.userid;
        var list = await Login.find();
        var promises = []; // Array to store promises
        for (let i = 0; i < list.length; i++) {
            var against = list[i].key;
            promises.push(new Promise((resolve, reject) => {
                bcrypt.compare(entered, against, function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            }));
        }
        // Wait for all promises to resolve
        Promise.all(promises)
            .then(results => {
                var checker = 0;
                for (let i = 0; i < results.length; i++) {
                    if (results[i]) {
                        checker = 1;
                        flag = 1;
                        toBeSent = list[i].key;
                        message = "You have logged in successfully.";
                        break;
                    }
                }
                if (checker == 1) {
                    res.render("index.ejs", { message: message, pw: toBeSent });
                } else {
                    flag = 0;
                    message = "Incorrect login attempt";
                    res.render("index.ejs", { message: message, pw: toBeSent });
                }
            })
            .catch(err => {
                console.error("Error:", err);
                message = "Unexpected error while retrieving password. Try again.";
                res.render("index.ejs", { message: message, pw: toBeSent });
            });
    }
});


app.post("/authenticate", async(req, res) => {
    if (flag == 1) {
        var message = " You are already signed up. ";
        res.render("index.ejs", {message: message});
    } else {
        const password = req.body.userpw;
        bcrypt.hash(password, 10, async function(err, hash) {
            if (err) {
              flag = 0;
              res.render("index.ejs", { message: "Unable to assign you a password. Try again."});
            } else {
                flag = 1;
                const newItem = new Login({
                    key : hash,
                });
                await Login.insertMany([newItem]).then(function () {
                    console.log("Successfully saved item to DB");
                }).catch(function (err) {
                    console.log(err);
                });
                res.render("authenticate.ejs", {pw: password});
            }
        });


    }
})

app.post("/logout", (req, res) => {
    flag = 0;
    res.render("index.ejs", { message: "You have succesfully been logged out. "});
})

app.get("/browse", async(req, res) => {
    
    res.render("browse.ejs", { cards: cards });
})
