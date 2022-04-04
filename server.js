const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const express = require("express");
const sessions = require("express-session");
const cookieParser = require("cookie-parser");
const socketIO = require("socket.io");
const http = require("http");
const bodyParser = require("body-parser");
const path = require("path");

const { body, validationResult } = require("express-validator");
const { phoneNumberFormatter } = require("./helper/formatPhone.js");
const { getUser, UpdateUser, cekApiKey } = require("./model/index");

//server connection
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    transports: ["websocket", "polling"],
  },
  allowEIO3: true,
});

const oneDay = 1000 * 60 * 60 * 24;
const username = "8888";
const passowrd = "otpwa"
var session;

app.use(
  sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.static(path.join(__dirname, "static")));

app.get("/", (req, res) => {
  res.sendFile("log.html", {
    root: __dirname,
  });
});

app.post("/auth", (req, res) => {
  let user = req.body.username;
  let pass = req.body.password;

  if (user == username && pass == password) {
    req.session.waconect == true ? (cw = req.session.waconect) : (cw = false);

    session = req.session;
    session.userid = user;
    session.login = true;
    session.waconect = cw;
    console.log(req.session);
    
    res.json({
        status: 200,
        login: true,
        users: session.userid,
      });

  } else {
    res.json({
      status: 500,
      login: false,
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect("/");
  });
});

app.get("/apps", (req, res) => {
  if (req.session.login == true) {
    res.sendFile("apps.html", {
      root: __dirname,
    });
  } else {
    res.redirect("/");
  }
});

app.post("/connect", (req, res) => {
  session = req.session;
  session.waconect = true;
  console.log(req.session);

  res.json({
    status: 200,
    waconect: true,
  });
});

app.post("/generet", (req, res) => {
  const apikey = req.body.message;
  const user = req.body.user;

  UpdateUser(apikey, user)
    .then((response) => {
      res.json({
        status: true,
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    });
});

app.post("/disconect", (req, res) => {
  session = req.session;
  session.waconect = false;
  console.log(req.session);

  res.json({
    status: 200,
    waconect: false,
  });
});

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
    ],
  },
  authStrategy: new LocalAuth(),
});

client.on("message", (message) => {
  console.log(message.body);
});

client.initialize();

// Socket IO
io.on("connection", function (socket) {
  socket.on("logout", () => {
    socket.emit("message", "Logout Success, Lets Scan Again");
    client.logout();
  });

  client.on("ready", () => {
    console.log("Client is ready!");
    socket.emit("ready", "Whatsapp is ready!");
    socket.emit("message", "Whatsapp is ready!");
  });

  client.on("qr", (qr) => {
    var count = 0;
    var interval = setInterval(function () {
      count++;
      console.log("count->", count);
      qrcode.toDataURL(qr, (err, url) => {
        socket.emit("qr", url);
        socket.emit("message", "QR Code received, scan please!");
        console.log("QR RECEIVED", qr);
      });
      if (count == 10) {
        socket.emit("message", "QR Code Refress");
      }
      clearInterval(interval);
    }, 1000);
  });

  client.on("authenticated", () => {
    socket.emit("authenticated", "Whastapp is authenticated!");
    socket.emit("message", "Whatsapp is authenticated!");
    socket.emit("waconect", true);
    console.log("AUTHENTICATED");
  });

  client.on("message_ack", (msg) => {
    socket.emit("message", "Message Success");
    console.error("MESSAGE SEND", msg);
  });

  client.on("auth_failure", (msg) => {
    // Fired if session restore was unsuccessful
    socket.emit("message", "Auth failure, restarting...");
    console.error("AUTHENTICATION FAILURE", msg);
    socket.emit("waconect", true);
  });

  client.on("disconnected", (msg) => {
    socket.emit("message", "Whatsapp is disconnected!");
    socket.emit("waconect", false);
    client.destroy();
    client.initialize();
    console.log("Client Disconnected");
  });
});

const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
};

app.post(
  "/api/v2/send-msg",
  [
    body("number").notEmpty(),
    body("message").notEmpty(),
    body("api_key").notEmpty(),
  ],
  (req, res) => {
    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;
    const api_key = req.body.api_key;
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.json({
        status: false,
        message: "can't empty",
      });
    } else {
      cekApiKey(api_key).then((result) => {
        var api = result[0].api_key;
        if (api !== "") {
          client
            .sendMessage(number, message)
            .then(() => {
              res.json({
                status: true,
                response: 200,
              });
            })
            .catch(() => {
              res.json({
                status: false,
                response: 500,
              });
            });
        } else {
          res.json({
            status: 400,
            api_sts: false,
          });
        }
      });
    }
  }
);

app.post(
  "/api/v1/send-msg",
  [body("number").notEmpty(), body("message").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }

    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;

    const isRegisteredNumber = await checkRegisteredNumber(number);
    if (!isRegisteredNumber) {
      return res.status(422).json({
        status: false,
        message: "The number is not registered",
      });
    }

    client
      .sendMessage(number, message)
      .then((response) => {
        res.status(200).json({
          status: true,
          response: response,
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
);

server.listen(port, () => {
  console.log(`cli-nodejs-api listening at ${port}`);
});
