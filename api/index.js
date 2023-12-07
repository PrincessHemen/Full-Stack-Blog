const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const User = require("./models/User")
const Post = require("./models/Post")
const bcrypt = require("bcrypt");
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer')
const uploadMiddleware = multer({ dest: 'uploads/' })
const fs = require('fs');

const salt = bcrypt.genSaltSync(10);
const secret = 'qwertyuiop';

app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect("mongodb+srv://hemendprincess:wGsAuDXrNm1rkShn@authdb.vd7walf.mongodb.net/cluster0?retryWrites=true&w=majority") 
   .then(() => {
      console.log("Connected to MongoDB");
   })
   .catch((err) => {
       console.error("MongoDB connection error:", err);
   });

app.post('/register', async (req, res) => {
    const {username, password} = req.body;
    try {
        const UserDoc = await User.create({
            username,
            password: bcrypt.hashSync(password, salt)
        });
        setTimeout(() => {
            res.json(UserDoc);
        }, 1000);
    } catch (error) {
        console.error('Error during registration:', error);
        // Send a meaningful error message in the response
        res.status(500).json({ error: 'Internal server error. Please try again.' });
    }
   
})

app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    const userDoc = await User.findOne({username});
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
        //logged in
        jwt.sign({username, id:userDoc._id}, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
             id:userDoc._id,
             username,   
            });
        })
    } else {
        //couldn't log in
        console.error('Error during login:', error);
        // Send a meaningful error message in the response
        res.status(400).json({ error: 'Internal server error. Please try again.' });
    }
})

app.get('/profile', (req, res) => {
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info);
    });
});

app.post('/logout', (req, res) => {
    res.cookie(token, '').json('ok');
})

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    try {
      // Process the file upload
      const {originalname,path} = req.file;
      const parts = originalname.split('.')
      const ext = parts[parts.length - 1]
      const newPath = path + '.' + ext
      fs.renameSync(path, newPath) 

      const{title, summary, content} = req.body
      const PostDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath,
      })

      res.json(postDoc);
    } catch (error) {
      // Log the error
      console.error('Error occurred during file upload:', error);
      // Respond with an error message
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

app.get('/post', async (res, req) => {
    res.json(await Post.find()); 
})

app.listen(4000, ()=>{
    console.log("Server running on port 4000")
});
