const { db } = require('./Database/db.js');

// 관리자 토큰 추가
const adminToken = 'test_admin_token_123';
const adminId = 'admin';
const adminRole = 'admin';

db.run(`INSERT INTO Admin (token, id, role) VALUES (?, ?, ?)`, [adminToken, adminId, adminRole], function(err) {
    if (err) {
        console.error('Admin 추가 실패:', err.message);
    } else {
        console.log('✅ Admin 토큰이 성공적으로 추가되었습니다!');
        console.log('토큰:', adminToken);
        console.log('ID:', adminId);
        console.log('역할:', adminRole);
    }
    
    // 데이터 확인
    db.all('SELECT * FROM Admin', (err, rows) => {
        if (err) {
            console.error('조회 실패:', err.message);
        } else {
            console.log('\n현재 Admin 테이블 데이터:');
            console.table(rows);
        }
        
        db.close();
    });
});
