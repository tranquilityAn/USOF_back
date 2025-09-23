const BaseModel = require('./BaseModel');

class User extends BaseModel {
    constructor({ 
        id, 
        login, 
        passwordHash, 
        fullName, 
        email, 
        emailVerified = false, 
        profilePicture = null, 
        rating = 0, 
        role = "user",
        createdAt = null,
        updatedAt = null
    }) {
        super(id);
        this.login = login;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.email = email;
        this.emailVerified = emailVerified;
        this.profilePicture = profilePicture;
        this.rating = rating;
        this.role = role;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    isAdmin() {
        return this.role === "admin";
    }

    toJSON() {
        const safeObject = super.toJSON();
        delete safeObject.passwordHash;
        return safeObject;
    }
}

module.exports = User;
