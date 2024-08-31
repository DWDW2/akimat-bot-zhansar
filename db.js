const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'mydb',
  port: 55000,
});

const connect = async () => {
  await pool.connect();
};

const query = async (text, params) => {
  const res = await pool.query(text, params);
  return res.rows;
};

module.exports = { connect, query };
