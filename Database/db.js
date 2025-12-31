var sqlite3 = require('sqlite3').verbose();
var dbPath = `${__dirname}/db.db`;

let db = new sqlite3.Database(dbPath/*dbPath*/, sqlite3.OPEN_READWRITE, (err) => {
    try {
        if (err) {
            console.error(err.message);
        } else {
            console.log('DATABASE 연동 성공!');

        }
    } catch(err) {
        console.log(err)
    }
}); 

db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, 'User', (err, row) => {
    if(!row) {
        try {
            db.run('CREATE TABLE User (enrollment_token, token, name, registration, address, address2, Date_created, area, img_link, date, expiration_date)')
            console.log("User 테이블 생성")
        } catch(err) {        

        }
    } else {
        // 기존 테이블에 address2 컬럼이 없는 경우 추가
        db.all("PRAGMA table_info(User)", (err, columns) => {
            const hasAddress2 = columns.some(col => col.name === 'address2');
            if (!hasAddress2) {
                db.run("ALTER TABLE User ADD COLUMN address2 TEXT", (err) => {
                    if (err) console.error("address2 컬럼 추가 실패:", err.message);
                    else console.log("User 테이블에 address2 컬럼 추가 완료");
                });
            }
        });
    }
})

db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, 'Admin', (err, row) => {
    if(!row) {
        try {
            db.run('CREATE TABLE Admin (token, id, role)')
            console.log("Admin 테이블 생성")
        } catch(err) {        

        }
    }
})

db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, 'Server', (err, row) => {
    if(!row) {
        try {
            db.run('CREATE TABLE Server (Notice)')
            console.log("Server 테이블 생성")
        } catch(err) {        

        }
    }
})

module.exports = {
    db,
}