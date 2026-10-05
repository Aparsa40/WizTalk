import fs from "fs";
import path from "path";



export async function runMigrations(
db:any
){


 db.exec(`

 CREATE TABLE IF NOT EXISTS schema_migrations(

 id INTEGER PRIMARY KEY AUTOINCREMENT,

 name TEXT UNIQUE NOT NULL,

 executed_at DATETIME DEFAULT CURRENT_TIMESTAMP

 );

 `);



 const migrationsPath =
 path.join(
 process.cwd(),
 "server",
 "database",
 "migrations"
 );



 if(!fs.existsSync(migrationsPath)){

  return;

 }



 const files =
 fs.readdirSync(migrationsPath)
 .filter(
 file=>file.endsWith(".sql")
 )
 .sort();



 for(const file of files){


  const exists =
  db.prepare(
  `
  SELECT name 
  FROM schema_migrations
  WHERE name = ?
  `
  )
  .get(file);



  if(exists){

   continue;

  }



  const sql =
  fs.readFileSync(
   path.join(
    migrationsPath,
    file
   ),
   "utf8"
  );



  db.exec(sql);



  db.prepare(
  `
  INSERT INTO schema_migrations(name)
  VALUES(?)
  `
  )
  .run(file);



 }


}