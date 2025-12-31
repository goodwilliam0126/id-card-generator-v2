const { db } = require('./Database/db.js');

db.all('SELECT * FROM User', (err, rows) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('User Table Data:');
        console.table(rows);
    }
    db.close();
});
