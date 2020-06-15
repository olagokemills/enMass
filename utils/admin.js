const jwt = require('jsonwebtoken');
module.exports= function (req, res, next){

    const decoded = jwt.decode(req.token)
    if (!decoded.isAdmin)
    {
      res.sendStatus(403).end();
    } 
    else{
      next();   
    }
   
} 
