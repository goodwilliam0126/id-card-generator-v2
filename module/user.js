const mongoose = require('mongoose');

// MongoDB 스키마 정의
const userSchema = new mongoose.Schema({
    enrollment_token: String,
    token: { type: String, unique: true },
    name: String,
    registration: String,
    address: String,
    address2: String,
    Date_created: String,
    area: String,
    img_link: String,
    date: String,
    expiration_date: String
});

const adminSchema = new mongoose.Schema({
    token: { type: String, unique: true },
    id: String,
    role: String
});

const serverSchema = new mongoose.Schema({
    Notice: String
});

const UserModel = mongoose.model('User', userSchema);
const AdminModel = mongoose.model('Admin', adminSchema);
const ServerModel = mongoose.model('Server', serverSchema);

class user {
    static async GetToken(token) {
        try {
            const data = await UserModel.find({ token: token });
            if (data.length > 0) {
                return { Token_data: data };
            } else {
                return 'Not Found';
            }
        } catch (err) {
            console.error(err);
            return 'Not Found';
        }
    }

    static async CreateTokenAvailable(token) {
        try {
            const data = await AdminModel.find({ token: token });
            if (data.length > 0) {
                return { Token_data: data };
            } else {
                return 'Not Found';
            }
        } catch (err) {
            console.error(err);
            return 'Not Found';
        }
    }

    static async CreateUsers(expiration_token, token, name, registration, address, address2, Date_created, area, img_link, date, expiration_date) {
        try {
            const newUser = new UserModel({
                enrollment_token: expiration_token,
                token,
                name,
                registration,
                address,
                address2,
                Date_created,
                area,
                img_link,
                date,
                expiration_date
            });
            await newUser.save();
            return true;
        } catch (err) {
            console.error(err);
            return err;
        }
    }

    static async CreateAdmin(token, id, role) {
        try {
            const newAdmin = new AdminModel({ token, id, role });
            await newAdmin.save();
            return true;
        } catch (err) {
            console.error(err);
            return err;
        }
    }

    static async AdminGetUser(token) {
        try {
            const users = await UserModel.find({ enrollment_token: token });
            const serverData = await ServerModel.find({});
            return {
                Token_data: users || [],
                data: serverData || []
            };
        } catch (err) {
            console.error(err);
            return { Token_data: [], data: [] };
        }
    }

    static async EditUser(User_data, token) {
        try {
            const updateData = { ...User_data };
            await UserModel.findOneAndUpdate({ token: token }, updateData);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    static async DeleteUser(token) {
        try {
            const userData = await UserModel.findOne({ token: token });
            if (!userData) return { success: false, message: 'error' };
            
            await UserModel.deleteOne({ token: token });
            return {
                success: true,
                data: [userData]
            };
        } catch (err) {
            console.error(err);
            return { success: false, message: 'error' };
        }
    }

    static async DeleteAdmin(token) {
        try {
            const adminData = await AdminModel.findOne({ token: token });
            if (!adminData) return { success: false, message: 'error' };

            await UserModel.deleteMany({ enrollment_token: token });
            await AdminModel.deleteOne({ token: token });
            return {
                success: true,
                data: [adminData]
            };
        } catch (err) {
            console.error(err);
            return { success: false, message: 'error' };
        }
    }

    static async AdminData() {
        try {
            const admins = await AdminModel.find({});
            return {
                success: true,
                data: admins
            };
        } catch (err) {
            console.error(err);
            return { success: false, data: [] };
        }
    }

    static async NoticeSave(value) {
        try {
            await ServerModel.findOneAndUpdate({}, { Notice: value }, { upsert: true });
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
}

module.exports = user;
