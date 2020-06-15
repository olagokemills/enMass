const User = require('../models/users.model');
const Verify = require('../models/verify.model')
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

function newToken(user){
  return jwt.sign({ id: user.id, email:user.email, role: user.isAdmin }, config.secret, {
    expiresIn: config.jwtExp
  })
}

//Read all users
exports.findAll = async(req, res, next) => {
    console.log(req)
    jwt.verify(req.token, config.secret, (err, authData) => {
       if(err){
        res.sendStatus(403).end();
       } });
        try{
            const user = await User.find({});
            res.send(user);
        // next();
            }catch(err){
                return next(res.json({
                    message: "something went wrong",
                   // authData
                })
              )
          }    
    }

//Get One User
 exports.findOne = async(req, res, next) => {
  jwt.verify(req.token, config.secret, (err) => {
    if(err){
     res.sendStatus(403).end();
    } });
     try{
         const user = await User.findById(req.params.id);
         if(!user)
          {
              res.status(404).
              send({
                  message:"User not Found"
              })
          }
         res.send(user)
     }catch(err){
        return res.status(500).json({
            message: "Something went wrong",
        })
     }
 }

//Create User
 exports.createUser = async(req, res) => {
    // Required fields check
    if (!req.body.email || !req.body.password || !req.body.phone )
        {
          return res.status(400).send({ message: 'Incomplete details, try again' })
        }
        const user = await User.findOne({ email: req.body.email })
        .select('email')
        .exec()
        if (user)
             {
            return res.status(403).send({message:"User exists" }).end();
             }
        try {
        const user = await User.create(req.body)
        const token = newToken(user);
        const verification =  verifyUser(req.body)
        return res.status(201).send({message:"Registration Ok!",token })
        } catch(err)
         { 
            return res.status(500).send('User exists or something is wrong')
         }
    }

    exports.signIn = async (req, res) => {
        if (!req.body.email || !req.body.password) {
        return res.status(400).send({ message: 'need email and password' })
        }
    
        const invalid = { message: 'Invalid email and password combination' }
    
        try {
        const user = await User.findOne({ email: req.body.email })
            .select('email password role')
            .exec()
    
        if (!user) {
            return res.status(401).send(invalid)
        }
    
        const match = await user.checkPassword(req.body.password)
    
        if (!match) {
            return res.status(401).send(invalid)
        }
        const token = newToken(user)
        return res.status(200).send({message:"Logged In", token })
        } catch (e) {
        res.status(500).end()
        }
    }

  exports.deleteUser = async(req, res)=>{
    jwt.verify(req.token, config.secret, (err, authData) => {
      if(err){
       res.sendStatus(403).end();
      } });
    try{
        const user = await User.findByIdAndRemove({
            _id: req.params.id
        })
        if(!user){
            return res.status(404).send({message: "User not found"});
        }
        return res.status(200).json({message: "User Removed"})
    }catch(e){
        res.status(400).end();
    }

  }


   exports.updateUser = async (req, res) => {    
    jwt.verify(req.token, config.secret, (err, authData) => {
      if(err){
       res.sendStatus(403).end();
      } });

    try {
      const user = await User.findOneAndUpdate(
        {
          _id: req.params.userId
        },
        req.body,
         { new: true}
      )
         .lean()
         .exec()

      if(!user){
        return res.status(400).end()
      }
      res.status(200).json({ data: user })
    } catch (e) {
      res.status(400).end()
    }
  }

function verifyUser(userData){
    let emailToken = newToken(userData)
    let url = `http://localhost:8080/api/Verification/${emailToken}`;
    //credentials
    let transporter = nodemailer.createTransport({
        host:config.email.auth.host,
        port:config.email.auth.port,
        secure:true,
        auth:{
            user:config.email.auth.user,
            pass:config.email.auth.pass
        }
    });
    //email body
    let mailOptions = {
        from: 'olagokemills@gmail.com',
        to: userData.email,
        subject: 'Verify your account',
        html: `Kindly Verify this from here: <a href="${url}">${url}</a>`
    };
    transporter.sendMail(mailOptions, function(err, data){
        if(err){
            res.status(500).end()
        }else if(data){
         next()
        }
    })      
}

//Verify User
exports.VerifyUser = async(req, res, next) => {
    let token = req.params.token
    jwt.verify(token, config.secret, (err) => {
      if(err){
       res.sendStatus(403).end();
      } });
      const decoded = jwt.decode(token)
      try{
          const user = await User.find(
              {
                  email: decoded.email
              }
          )
          if(!user)
          {
            res.status(404).send({ message:"User not Found"}).end()
          }
          else if(user.isVerified)
          {
            res.status(403).send({ message:"User Already Verified"}).end()
          }
          const upadated = await User.findOneAndUpdate(
            {
              email: decoded.email
            },
            {isVerified: true},
             { new: true}
          )
             .lean()
             .exec()
         return res.status(200).json({message: "User Verified!"})
      }
      catch(err){
        return res.status(500).json({
            message: "Something went wrong",
         })
      }
   }

   //Get Password Reset Link
   exports.GetResetLink = async(req, res, next) =>{
    if (!req.body.email) {
        return res.status(400).send({ message: 'Email Required for this!' })
        }
        try{
            const user =  await User.findOne({
                email: req.body.email
            })
            if(!user){
                return res.status(400).send({message: "No account Match, please try again!"}).end()
              }
            const verification =  resetLink(user)
           return res.status(200).send({message:"Password Reset Link Successfully sent!"})
        }
        catch{
            return res.status(500).send('User Does not exists or something is wrong')
        }
   }

   function resetLink(userData){   
    const emailToken = newToken(userData);
    let url = `http://localhost:8080/api/ResetPassword/${emailToken}`;
    //credentials
    let transporter = nodemailer.createTransport({
        host:config.email.auth.host,
        port:config.email.auth.port,
        secure:true,
        auth:{
            user:config.email.auth.user,
            pass:config.email.auth.pass
        }
    });
    //email body
    let mailOptions = {
        from: 'olagokemills@gmail.com',
        to: userData.email,
        subject: 'Reset your Password',
        html: `Follow this Link to reset your account :  <a href="${url}">${url}</a>`
    };
    transporter.sendMail(mailOptions, function(err, data){
        if(err){
         res.status(500).end()
        }else if(data){
         next()
        }
    })      
}

exports.ChangePassword = async(req,res, next)=>{
    let token = req.params.token
    jwt.verify(token, config.secret, (err) => {
      if(err){
       res.sendStatus(403).end();
        } 
     });
      const decoded = jwt.decode(token)  
      try{
        const user = await User.find(
            {
                email: decoded.email
            }
        )
        if(!user)
        {
          res.status(404).send({ message:"User not Found"}).end()
        }
        const updatedUser = await User.findOneAndUpdate(
            {
              _id: req.body.userId
            },
            req.body,
             { new: true}
          )
             .lean()
             .exec()
       return res.status(200).json({message: "Password Changed!"})
    }
    catch(err){
      return res.status(500).json({
          message: "Something went wrong",
       })
    }
}