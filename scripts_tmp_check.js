const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await c.query('SELECT name, category FROM `groups`');
  console.log(JSON.stringify(rows));
  await c.end();
})();
