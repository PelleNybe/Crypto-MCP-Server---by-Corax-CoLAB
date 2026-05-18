const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run("CREATE TABLE test (name TEXT)");
  const stmt = db.prepare("INSERT INTO test (name) VALUES (?)");
  try {
    stmt.run(["array_val1", "array_val2"], (err) => {
      console.log("callback err:", err);
    });
  } catch (e) {
    console.log("caught exception:", e);
  }
});
