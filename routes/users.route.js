module.exports = (app) => {

    const users = require('../controllers/users.controller');
    const verify = require('../utils/auth');
    const admin = require('../utils/admin');

    //Get all users
    app.get('/api/users',[verify], users.findAll);
    //Get specific user
    app.get('/api/user/:id', verify, users.findOne);
    //Create User
    app.post('/api/users/', users.createUser);
    // //User signIn
    app.post('/api/user/login', users.signIn);
    // //Delete User
    //  app.delete('/api/user/remove/:id', verify, users.deleteUser);
    // //Update User
    app.put('/api/user/update/:userId', verify, users.updateUser);
    //Verify user
    app.get('/api/Verification/:token', users.VerifyUser)
    //Reset Password
    app.post('/api/ResetPasswordLink', users.GetResetLink)
    //Replace Password
    app.post('/api/ChangePassword/:token', users.ChangePassword)
}