const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  const hashPassword = await bcrypt.hash(request.body.password, 10);
  const checkUsername = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await database.get(checkUsername);
  if (dbUser === undefined) {
    if (password.length > 4) {
      console.log(hashPassword);
      const postQuery = `
            INSERT INTO user (username,name,password,gender,location )
            values ('${username}','${name}','${hashPassword}','${gender}','${location}');`;
      const postResponse = await database.run(postQuery);
      console.log(postQuery);
      response.status = 200;
      response.send("User created successfully");
    } else {
      response.status = 400;
      response.send("Password is too short");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUsername = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await database.get(checkUsername);
  if (dbUser === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    console.log(isPasswordMatched);
    if (isPasswordMatched === true) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUsername = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await database.get(checkUsername);
  if (dbUser === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      if (newPassword.length > 4) {
        const updatePassword = await bcrypt.hash(request.body.newPassword, 10);
        const updateNewPassword = `
                UPDATE user SET password='${updatePassword}' WHERE username='${username}';`;
        const updatedPasswordResponse = await database.run(updateNewPassword);
        response.status = 200;
        response.send(" Successful password update");
      } else {
        response.status = 400;
        response.send("Password is too short");
      }
    } else {
      response.status = 400;
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
