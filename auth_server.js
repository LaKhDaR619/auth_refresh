const express = require("express");
const jwt = require("jsonwebtoken");

const PORT = 3500;
const access_secret = "ASECRET";
const refresh_secret = "RSECRET";
const access_lifetime = 10; // 10 seconds
const refresh_lifetime = 3600; // 1 hour

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

app.use(express.json());

const user = {
  username: "test",
  password: "1234",
};

// login
app.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === user.username && password === user.password) {
      const access_token = jwt.sign(
        {
          sub: { username },
          iat: Math.round(Date.now() / 1000),
          exp: Math.round(Date.now() / 1000 + access_lifetime),
        },
        access_secret
      );
      const refresh_token = jwt.sign(
        {
          sub: { username },
          iat: Math.round(Date.now() / 1000),
          exp: Math.round(Date.now() / 1000 + refresh_lifetime),
        },
        refresh_secret
      );

      return res.json({
        access_token,
        refresh_token,
      });
    }

    res.sendStatus(401);
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
});

// refresh the token
app.post("/refresh", (req, res) => {
  try {
    const access_token = req.headers.access_token;
    const refresh_token = req.headers.refresh_token;

    const access_token_payload = jwt.verify(access_token, access_secret, {
      ignoreExpiration: true,
    });
    const refresh_token_payload = jwt.verify(refresh_token, refresh_secret);

    if (
      access_token_payload.sub.username !== refresh_token_payload.sub.username
    )
      return res.sendStatus(401);

    const { username } = access_token_payload.sub;
    const new_access_token = jwt.sign(
      {
        sub: { username },
        iat: Math.round(Date.now() / 1000),
        exp: Math.round(Date.now() / 1000 + access_lifetime),
      },
      access_secret
    );
    const new_refresh_token = jwt.sign(
      {
        sub: { username },
        iat: Math.round(Date.now() / 1000),
        exp: Math.round(Date.now() / 1000 + refresh_lifetime),
      },
      refresh_secret
    );

    res.json({
      access_token: new_access_token,
      refresh_token: new_refresh_token,
    });
  } catch {
    res.sendStatus(401);
  }
});

app.listen(PORT, () => console.log(`auth server listening at port: ${PORT}`));
