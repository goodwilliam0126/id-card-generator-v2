require('dotenv').config();
const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');
const moment = require('moment');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const crypto = require("crypto");
const fs = require('fs');
const QRCode = require('qrcode');
const user = require('./module/user.js');

// MongoDB 연결 및 진단 로그
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Iddb:nmh523523523@cluster0.x9qfas3.mongodb.net/?appName=Cluster0';

console.log('--- Environment Check ---');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('CLOUDINARY_CLOUD_NAME exists:', !!process.env.CLOUDINARY_CLOUD_NAME);
console.log('-------------------------');

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected Successfully!');
        // 환경 변수에 설정된 ADMIN_TOKEN으로 관리자 자동 생성
        const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'sexy';
        const existingAdmin = await mongoose.model('Admin').findOne({ token: ADMIN_TOKEN });
        if (!existingAdmin) {
            await mongoose.model('Admin').create({
                token: ADMIN_TOKEN,
                id: 'admin',
                role: 'admin'
            });
            console.log(`✅ Admin created with token: ${ADMIN_TOKEN}`);
        }
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
    });

// Cloudinary 설정 (환경 변수가 있을 때만 활성화)
let storage;
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'id-cards',
            allowed_formats: ['jpg', 'png', 'jpeg'],
            public_id: (req, file) => path.basename(file.originalname, path.extname(file.originalname)) + Date.now()
        },
    });
} else {
    // Cloudinary 설정이 없을 경우 로컬 저장소 사용 (임시)
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = './views/upload';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        }
    });
}

const uploader = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.json());
app.use(express.static('views'));

app.get('/', async (req, res) => {
    let { token } = req.query
    let { check } = req.query

    if(!token) {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let users = await user.GetToken(token)

    if(users === 'Not Found' || users === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let expiration_date = moment(users.Token_data[0].expiration_date)
    let current_date = moment()
    let remaining = expiration_date.diff(current_date, 'days')
    
    if(remaining < 0) {
        return res.json({
            ok: false,
            message: "만료되었습니다. 연장이 필요해요."
        })
    }

    if(check != undefined) {
        return res.render('check', {
            name: users.Token_data[0].name,
            expiration_date: users.Token_data[0].expiration_date,
            date: users.Token_data[0].date,
            remaining: remaining
        })
    }

    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let qr_data = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 54; i++) {
        qr_data += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    const qr_image = await QRCode.toDataURL(qr_data);

    res.render('main', {
        img_link: users.Token_data[0].img_link,
        name: users.Token_data[0].name,
        registration: users.Token_data[0].registration,
        address: users.Token_data[0].address,
        address2: users.Token_data[0].address2,
        Date_created: users.Token_data[0].Date_created,
        area: users.Token_data[0].area,
        token: token,
        qr_image: qr_image
    })
})

app.get('/api/get_qr', async (req, res) => {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 54; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    try {
        const url = await QRCode.toDataURL(result);
        res.json({ ok: true, qr_image: url });
    } catch (err) {
        res.status(500).json({ ok: false, message: "QR 생성 실패" });
    }
})

app.get('/admin', async (req, res) => {
    let { token } = req.query

    if(!token) {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let is_available = await user.CreateTokenAvailable(token)

    if(is_available === 'Not Found') {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let User_data = await user.AdminGetUser(token)

    if(is_available.Token_data[0].role == 'admin') {
        let Admin_Data = await user.AdminData()
        return res.render('admin', { 
            token: token,
            User_data: User_data.Token_data || [],
            admin: true,
            data: Admin_Data.data || [],
            notice: User_data.data && User_data.data[0] ? User_data.data[0].Notice : ""
        })
    }

    return res.render('admin', { 
        token: token,
        User_data: User_data.Token_data || [],
        admin: false,
        data: [], // 일반 관리자일 때도 빈 배열 전달
        notice: User_data.data && User_data.data[0] ? User_data.data[0].Notice : ""
    })
})

app.get('/edit', async (req, res) => {
    let { token } = req.query
    let { user_token } = req.query

    if(!token) {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let is_available = await user.CreateTokenAvailable(token)

    if(is_available === 'Not Found') {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let users = await user.GetToken(user_token)

    res.render('edit', { 
        token,
        users
    })
})

app.get('/create', async (req, res) => {
    let { token } = req.query

    if(!token) {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    let is_available = await user.CreateTokenAvailable(token)

    if(is_available === 'Not Found') {
        return res.status(400).json({
            success: false,
            message: 'Not Found Token'
        })
    }

    res.render('create', { 
        token
    })
})

var getFields = multer();
app.post('/api/:type', async (req, res) => {
    let { type } = req.params

    if(type === 'save') {
        uploader.single('file')(req, res, async (err) => {
            if (err) {
                console.error("Upload Error:", err);
                return res.status(500).json({ success: false, message: "파일 업로드 실패" });
            }

            let { admin_token } = req.body
            let { token } = req.body

            if(!admin_token) {
                return res.status(400).json({ success: false, message: 'Not Found Token' })
            }

            let is_available = await user.CreateTokenAvailable(admin_token)
            if(is_available === 'Not Found') {
                return res.status(400).json({ success: false, message: 'Not Found Token' })
            }

            const data = {
                name: req.body.name,
                registration: req.body.registration,
                address: req.body.address,
                address2: req.body.address2,
                area: req.body.area,
                Date_created: req.body.Date_created,
                expiration_date: req.body.expiration_date,
            }

            if (req.file) {
                data.img_link = req.file.path; // Cloudinary URL
            }

            let EditUser = await user.EditUser(data, token)
            if(EditUser === true) {
                return res.render('success', { type: 'edit' })
            } else {
                return res.json({ success: false, message: "수정에 실패했습니다" })
            }
        });
        return;
    }

    getFields.any()(req, res, async (err) => {
        if (err) return res.status(500).json({ success: false, message: "데이터 처리 실패" });

        if(type === 'admin_create') {
            let { id, token, role, admin_token } = req.body
            if(!admin_token) return res.status(400).json({ success: false, message: 'Not Found Token' })
            
            let is_available = await user.CreateTokenAvailable(admin_token)
            if(is_available === 'Not Found' || is_available.Token_data[0].role != 'admin') {
                return res.status(400).json({ success: false, message: 'Not Found Token' })
            }
        
            let CreateAdmin = await user.CreateAdmin(token, id, role)
            if(CreateAdmin != true) return res.json({ ok: false, message: "총판을 만드는데 실패했습니다"})
            return res.json({ ok: true, message: "총판을 만드는데 성공했습니다" })
        }

        if(type === 'admin_noticeSave') {
            let { admin_token, textarea } = req.body 
            if(!admin_token) return res.status(400).json({ success: false, message: 'Not Found Token' })
            
            let is_available = await user.CreateTokenAvailable(admin_token)
            if(is_available === 'Not Found' || is_available.Token_data[0].role != 'admin') {
                return res.status(400).json({ success: false, message: 'Not Found Token' })
            }

            let NoticeSave = await user.NoticeSave(textarea)
            if(NoticeSave != true) return res.json({ ok: false, message: "공지 저장에 실패했습니다"})
            return res.json({ ok: true, message: "공지 저장에 성공했습니다" })
        }

        if(type === 'delete') {
            let { admin_token, token } = req.body
            if(!admin_token) return res.status(400).json({ success: false, message: 'Not Found Token' })
            
            let is_available = await user.CreateTokenAvailable(admin_token)
            if(is_available === 'Not Found') return res.status(400).json({ success: false, message: 'Not Found Token' })
        
            if(req.body.type === 'Admin') {
                if(is_available.Token_data[0].role != 'admin') return res.json({ ok: false, message: '총관리자 권한이 없습니다'})
                let DeleteAdmin = await user.DeleteAdmin(token)
                if(DeleteAdmin.success === false) return res.json({ ok:false, message: '알 수없는 이유로 총판 삭제에 실패했습니다'})
                return res.json({ ok: true, message: '총판을 성공적으로 제거했습니다' })
            }
        
            if(req.body.type === 'User') {
                let DeleteUser = await user.DeleteUser(token)
                if(DeleteUser.success === false) return res.json({ ok:false, message: '알 수없는 이유로 유저 삭제에 실패했습니다'})
                return res.json({ ok: true, message: '유저를 성공적으로 제거했습니다' })
            }
        }
    });
})

app.post('/upload', uploader.single('file'), async (req, res) => {
    let { name, registration, address, address2, Date_created, area, expiration } = req.body
    let expiration_token = req.body.token
    let token = crypto.randomBytes(20).toString('hex')

    let is_available = await user.CreateTokenAvailable(expiration_token)
    if(is_available === 'Not Found') return res.status(400).json({ success: false, message: 'Not Found Token' })

    let time = moment().format('YYYY-MM-DD')
    let expiration_date = moment().add(Number(expiration), 'd').format('YYYY-MM-DD')

    let img_link = req.file ? req.file.path : '';

    let CreateUser = await user.CreateUsers(expiration_token, token, name, registration, address, address2, Date_created, area, img_link, time, expiration_date)

    if(CreateUser === true) {
        const protocol = req.protocol;
        const host = req.get('host');
        return res.render('success', {
            type: 'create',
            url: `${protocol}://${host}/?token=${token}`
        })
    } else {
        return res.json({ ok: false, message: "알 수 없는 이유로 업로드에 실패했습니다" })
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
