const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://Iddb:nmh523523523@cluster0.x9qfas3.mongodb.net/?appName=Cluster0';

const adminSchema = new mongoose.Schema({
    token: { type: String, unique: true },
    id: String,
    role: String
});

const AdminModel = mongoose.model('Admin', adminSchema);

async function insertAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB...');

        const ADMIN_TOKEN = 'sexy';
        
        // 기존 관리자 확인 및 삭제 (중복 방지)
        await AdminModel.deleteOne({ token: ADMIN_TOKEN });
        
        await AdminModel.create({
            token: ADMIN_TOKEN,
            id: 'admin',
            role: 'admin'
        });

        console.log(`✅ Admin account created successfully with token: ${ADMIN_TOKEN}`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

insertAdmin();
