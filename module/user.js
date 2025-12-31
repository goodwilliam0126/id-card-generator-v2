const { db } = require('../Database/db.js')
const moment = require('moment');

class user {
    static async GetToken(token) {
        return new Promise(function(resolve, reject) {
            db.all('SELECT * FROM User', async (err, data) => {
                let some = data.some(v => v.token === token)
                let GetTokens = data.map(v => { 
                    if(v.token === token) {
                        return v
                    }
                })
                let TokenData = GetTokens.filter((element, i) => element !== undefined);

                if(some) {
                    resolve({
                        Token_data: TokenData
                    })
                } else {
                    resolve('Not Found')
                }
            })
        })
    }

    static async CreateTokenAvailable(token) {
        return new Promise(function(resolve, reject) {
            db.all('SELECT * FROM Admin', async (err, data) => {
		        let some = data.some(v => v.token === token)
                let GetTokens = data.map(v => { 
                    if(v.token === token) {
                        return v
                    }
                })
                let TokenData = GetTokens.filter((element, i) => element !== undefined);

                if(some) {
                    resolve({
                        Token_data: TokenData
                    })
                } else {
                    resolve('Not Found')
                }
            })
        })
    }

    static async CreateUsers(expiration_token, token, name, registration, address, address2, Date_created, area, img_link, date, expiration_date) {
        return new Promise(function(resolve, reject) {
            try {
                db.run(`INSERT INTO User (enrollment_token, token, name, registration, address, address2, Date_created, area, img_link, date, expiration_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [expiration_token, token, name, registration, address, address2, Date_created, area, img_link, date, expiration_date])
                resolve(true)
            } catch(err) {
                resolve(err)
            }
        })
    }

    static async CreateAdmin(token, id, role) {
        return new Promise(function(resolve, reject) {
            try {
                db.run(`INSERT INTO Admin (token, id, role) VALUES (?, ?, ?)`, [token, id, role])
                resolve(true)
            } catch(err) {
                resolve(err)
            }
        })
    }

    static async AdminGetUser(token) {
        return new Promise(function(resolve, reject) {
            try {
                db.all('SELECT * FROM User', async (err, data) => {
                    let GetTokens = data.map(v => { 
                        if(v.enrollment_token === token) {
                            return v
                        }
                    })
                    let TokenData = GetTokens.filter((element, i) => element !== undefined);
                    db.all('SELECT * FROM Server', async (err, data) => {
    
                        resolve({
                            Token_data: TokenData,
                            data
                        })
                    })
                })
            } catch(err) {
                resolve(err)
            }
        })
    }

    static async EditUser(User_data, token) {
        return new Promise(function(resolve, reject) {
            try {
                db.all('SELECT * FROM User', async (err, data) => {
                    let some = data.some(v => v.token === token)
                    
                    if(some === false) {
                        resolve(false)
                    }

                    if (User_data.img_link) {
                        db.run(`UPDATE User SET name = ?, registration = ?, address = ?, address2 = ?, Date_created = ?, area = ?, expiration_date = ?, img_link = ? WHERE token = ?`, [User_data.name, User_data.registration, User_data.address, User_data.address2, User_data.Date_created, User_data.area, User_data.expiration_date, User_data.img_link, token])
                    } else {
                        db.run(`UPDATE User SET name = ?, registration = ?, address = ?, address2 = ?, Date_created = ?, area = ?, expiration_date = ? WHERE token = ?`, [User_data.name, User_data.registration, User_data.address, User_data.address2, User_data.Date_created, User_data.area, User_data.expiration_date, token])
                    }
                    resolve(true)
                })
            } catch(err) {
                resolve(err)
            }
        })
    }

    static async DeleteUser(token) {
        return new Promise(function(resolve, reject) {
            try {
                db.all('SELECT * FROM User', async (err, data) => {
                    let some = data.some(v => v.token === token)
                    let GetTokens = data.map(v => { 
                        if(v.token === token) {
                            return v
                        }
                    })
                    let TokenData = GetTokens.filter((element, i) => element !== undefined);
                    
                    if(some === false) {
                        resolve({
                            success: false,
                            message: 'error'
                        })
                    }

                    
                    db.run(`DELETE FROM User WHERE token = "${token}"`)
                    resolve({
                        success: true,
                        data: TokenData
                    })
                })
            } catch(err) {
                resolve(err)
            }
        })
    }

    static async DeleteAdmin(token) {
        return new Promise(function(resolve, reject) {
            try {
                db.all('SELECT * FROM Admin', async (err, data) => {
                    let some = data.some(v => v.token === token)
                    let GetTokens = data.map(v => { 
                        if(v.token === token) {
                            return v
                        }
                    })
                    let TokenData = GetTokens.filter((element, i) => element !== undefined);
                    
                    if(some === false) {
                        resolve({
                            success: false,
                            message: 'error'
                        })
                    }

                    db.run(`DELETE FROM User WHERE enrollment_token = "${token}"`)
                    db.run(`DELETE FROM Admin WHERE token = "${token}"`)
                    resolve({
                        success: true,
                        data: TokenData
                    })
                })
            } catch(err) {
                resolve(err)
            }
        })
    }


    static async AdminData() {
        return new Promise(function(resolve, reject) {
            db.all('SELECT * FROM Admin', async (err, data) => {
                resolve({
                    success: true,
                    data
                })
            })
        })
    }

    static async NoticeSave(value) {
        return new Promise(function(resolve, reject) {
            db.run(`UPDATE Server SET Notice = ?`, [value])
            resolve(true)
        })
    }
}

module.exports = user