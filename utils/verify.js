const config = require('../config/config');
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next){

jwt.verify(req.token, config.secret, (err) => {
    if(err){
     res.sendStatus(403);
    } 
    else{
         next();
    }
});  

}