const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const crypto = require('crypto');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

app.use(bodyParser.json());

const unuq_codes = [];

/**
 * Helper function to pad a number with leading zeros
 * @param {Number} num - The number to pad
 * @returns {String} The padded number as a string
 */
function padZero(num) {
  return num.toString().padStart(2, '0');
}

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

/**
 * Helper function to parse cookies from request headers
 * @param {String} cookie - The cookie string from headers
 * @param {String} name - The name of the cookie to parse
 * @returns {String|undefined} The parsed cookie if it exists, else undefined
 */
function parseCookie(cookie, name) {
  if (!cookie) return;

  let cookieValue;
  cookie.split(';').forEach((item) => {
    const parts = item.split('=');
    if (parts.shift().trim() === name) {
      cookieValue = decodeURI(parts.join('='));
    }
  });

  return cookieValue;
}

/**
 * SocketHandler class which handles WebSocket connections and related operations
 */
class SocketHandler {
  constructor() {
    this.socket = null;
    this.isUp = false;
    this.userKeyPairs = new Map();
    this.logMap = new Map();
    this.banned = [];
    this.reconnectInterval = null;
    this.start();
  }

  start() {
    this.initSocket();
    this.startReconnectInterval();
  }

  initSocket() {
    this.socket = new WebSocket("wss://portal.evelteam.su/serverAPI");
    
    // this.socket = new WebSocket("ws://localhost:8082/serverAPI");
    this.socket.onopen = this.onSocketOpen.bind(this);
    this.socket.onclose = this.onSocketClose.bind(this);
    this.socket.binaryType = 'arraybuffer';
  }

  onSocketOpen() {
    console.log(`\x1b[90m[${this.formatTime(Date.now())}]\x1b[0m Connection established`);
    this.isUp = true;
  }

  onSocketClose(e) {
    console.log(`\x1b[90m[${this.formatTime(Date.now())}]\x1b[0m Connection closed`);
    this.isUp = false;
  }

  startReconnectInterval() {
    this.reconnectInterval = setInterval(() => {
      if (!this.isUp) this.initSocket();
    }, 1500);
  }

  generateToken(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charLength = characters.length;
    let token = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charLength);
      token += characters.charAt(randomIndex);
    }

    return token;
  }
  formatTime(timestamp) {
    const dateObj = new Date(timestamp);
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const seconds = dateObj.getSeconds();
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
  }
  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }
  restoreNumber(indices, shuffledNumber) {
    const charArray = Array.from(shuffledNumber);
    const restoredNumberArray = new Array(indices.length);
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      const char = charArray[i];
      restoredNumberArray[index] = char;
    }
    const restoredNumber = parseInt(restoredNumberArray.join(''), 10);
    return restoredNumber;
  }
  importPublicKeyFromString = (keyString) => {
    try {
      const cleanedKeyString = keyString
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\n/g, '');

      const keyData = Buffer.from(cleanedKeyString, 'base64');
      return crypto.createPublicKey({
        key: keyData,
        format: 'der',
        type: 'spki'
      });
    } catch (err) {
      console.error('Error importing public key:', err);
      throw err;
    }
  };
}

const socketHandler = new SocketHandler();

app.use((req, res, next) => {
  const otherIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const otherIpv6 = req.headers['Cf-Connecting-IPv6'];

  if (socketHandler.banned.includes(otherIp) || socketHandler.banned.includes(otherIpv6)) return res.end();
  next();
});

app.get("/get-public-key", (req, res) => {
  const { publicKey, privateKey } = socketHandler.generateKeyPair();
  const userId = uuidv4();
  socketHandler.userKeyPairs.set(userId, { publicKey, privateKey });
  res.json({ publicKey, userId });
});


app.post("/loader", async (req, res) => {
  const publicKeyPem = req.body.data.p;

  if (!publicKeyPem) {
    console.log(`No public key`);
    return res.sendStatus(400);
  }
  const clientPublicKey = socketHandler.importPublicKeyFromString(publicKeyPem);

  let scriptSource = fs.readFileSync('aKafj.js', 'utf-8');

  const unq_code = uuidv4();

  unuq_codes.push(unq_code);

  scriptSource = scriptSource.replace("NEED_TO_REPLACE", unq_code);

  const response = await axios.post("http://localhost:3000/api/compile", {code: scriptSource});

  if(response.status !== 200) return res.sendStatus(201);

  const filename = `/${uuidv4()}.js`;

  const filePath = path.join(__dirname, "./public" + "/loader" + filename);
  fs.writeFileSync(filePath, response.data.code);
  const responseData = {
    message: "./loader" + filename,
  };

  const encryptedResponseData = crypto.publicEncrypt(
    {
      key: clientPublicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256"
    },
    Buffer.from(JSON.stringify(responseData))
  ).toString('base64');

  res.json({ encrypted_response_data: encryptedResponseData });

  setTimeout(async () => {
    try {
    fs.unlinkSync(filePath)
    } catch (err) {}
  }, 15000)

})


app.post("/cloudflare", async (req, res) => {
  try {
    const encryptedData = req.body.encrypted_data;
    const userId = req.body.userId;
    const publicKeyPem = req.body.p;
   

    if (!encryptedData || !userId || !publicKeyPem) {
      console.error('Missing encrypted data, user ID, or public key in the request body');
      return res.sendStatus(400);
    }

    const userKeyPair = socketHandler.userKeyPairs.get(userId);
    if (!userKeyPair) {
      return res.sendStatus(400);
    }

    const userPrivateKey = userKeyPair.privateKey;

    // Decrypt the encrypted data using the user's private key
    const decryptedData = crypto.privateDecrypt(
      {
        key: userPrivateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256"
      },
      Buffer.from(encryptedData, 'base64')
    );

    const data = JSON.parse(decryptedData);

    const unqu_code = data._u;

    const isExists = unuq_codes.find((code) => code === unqu_code);

    if(!isExists || !unqu_code) {
      return res.sendStatus(403)
    };

    let ind = unuq_codes.indexOf(unqu_code)
    unuq_codes.splice(ind, 1);
    if (data._i) {

      const cookie = req.headers['cookie'];
      const cfBmCookie = parseCookie(cookie, "__cf_bm");
      const cfBmExists = cfBmCookie ? true : false;
      const _vid_t = parseCookie(cookie, "_vid_t");
      const vidtExists = _vid_t ? true : false;
      const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const logString = `\x1b[90m[${socketHandler.formatTime(Date.now())}]\x1b[0m \x1b[33m[CLOUDFLARE]\x1b[0m \x1b[31m[${ip}]\x1b[0m \x1b[34m[${data._i}]\x1b[0m: \x1b[0m ${cfBmExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'} ${vidtExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`;
      console.log(logString);
      const clientPublicKey = socketHandler.importPublicKeyFromString(publicKeyPem);

      userKeyPair.clientPublicKey = clientPublicKey;

      let scriptSource = fs.readFileSync('client.v10.js', 'utf-8');


      let string = uuidv4();
      userKeyPair.decryptedClientKey = string;
      const encryptedClientKey = crypto.publicEncrypt(
        {
          key: clientPublicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256"
        },
        Buffer.from(JSON.stringify(string))
      ).toString('base64');
      const ENCRYPTED_FUNCTION =  makeid(18);
      const REPLACE_CRYPTO = makeid(16);
      scriptSource = scriptSource.replace("NEED_TO_BE_REPLACED", encryptedClientKey)
      .replace("ENCRYPT_FUNCTION_REPLACE",ENCRYPTED_FUNCTION).replace("ENCRYPT_FUNCTION_REPLACE",ENCRYPTED_FUNCTION).replace("ENCRYPT_FUNCTION_REPLACE",ENCRYPTED_FUNCTION)
      .replace("NEED_TO_REPLACE_NAME_CRYPTO",REPLACE_CRYPTO ).replace("NEED_TO_REPLACE_NAME_CRYPTO",REPLACE_CRYPTO ).replace("NEED_TO_REPLACE_NAME_CRYPTO",REPLACE_CRYPTO );
      // ENCRYPT_FUNCTION_REPLACE - encryptMessage
      // NEED_TO_REPLACE_NAME_CRYPTO - cryptoKey

      const filename = `/${uuidv4()}.js`;

      // Path where the new script file will be created
      const filePath = path.join(__dirname, "./public" + "/users" + filename);

      userKeyPair.path = filePath;
      fs.writeFileSync(filePath, scriptSource);
      const responseData = {
        message: "./users" + filename,
      };


      const encryptedResponseData = crypto.publicEncrypt(
        {
          key: clientPublicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256"
        },
        Buffer.from(JSON.stringify(responseData))
      ).toString('base64');


      // Return the encrypted response data
      return res.json({ encrypted_response_data: encryptedResponseData });
    }
    return res.sendStatus(400);
  } catch (err) {
    console.error('Error processing /cloudflare request:', err);
    return res.sendStatus(500);
  }


});



app.post("/science", (req, res) => {
  const encryptedData = req.body.encrypted_data;
  const userId = req.body.userId;
  const publicKey = req.body.p; // Public key received from the client
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const contentLength = req.headers['content-length'];
  if (!encryptedData || !userId) {
    console.error('Missing encrypted data or user ID in the request body');
    return res.sendStatus(400);
  }
  const userKeyPair = socketHandler.userKeyPairs.get(userId);
  if (!userKeyPair) {
    console.log(`[201] [NO USER ID]: ${userId} [${ip}] | ${contentLength}`)
    return res.sendStatus(201);
  }

  const userPrivateKey = userKeyPair.privateKey;
  const decryptedData = crypto.privateDecrypt(
    {
      key: userPrivateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256"
    },
    Buffer.from(encryptedData, 'base64')
  );


  const data = JSON.parse(decryptedData);
  try {
    if (data._i == "yiChgIAvE2xuJCIOhqII" || data._i == "Y6BVWTE6S09yyzEtr3Ji" || data._i == "iz96dkfu4G1tY8kbjnJq" || data._i == "doMBmcugEoIFQ6ovkApT" || data._i == "YCTY7n4RjQFF3pXXsosi" || data._i == "00l4kmiiee2eNbbGgXEc" || data._i == "NdocBKeKJ1Ts0eOU72fw" || data._i == "5wqZTsyMdt6GhUXGLRBb" || data._i == "8CpNOl0qtNkjEUyEytZy" || !data._i || data._i == "undefined") {

      const origin = req.headers['origin'];
      const cookie = req.headers['cookie'];
      const cfRay = req.headers['cf-ray'];
      const userAgent = req.headers['user-agent'];

      const cfBmCookie = parseCookie(cookie, "__cf_bm");
      const cfBmExists = cfBmCookie ? true : false;
      const _vid_t = parseCookie(cookie, "_vid_t");
      const vidtExists = _vid_t ? true : false;
      const logString = `\x1b[90m[${socketHandler.formatTime(Date.now())}]\x1b[0m \x1b[31m[IP BAN | ERROR] \x1b[0m \x1b[31m[${ip}]\x1b[0m \x1b[34m[${data._i}]\x1b[0m: L:${contentLength} O:${origin} cR:${cfRay} \x1b[0m ${cfBmExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'} ${vidtExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`;
      console.log(`\x1b[90m[${socketHandler.formatTime(Date.now())}] \x1b[31m[USER AGENT | IP BAN | ERROR] \x1b[0m \x1b[31m[${ip}]\x1b[0m \x1b[0m ${userAgent} `)
      console.log(logString);
      return res.sendStatus(400);
    }


    const rgb = socketHandler.userKeyPairs.get(userId);


    if (data._i == "btHM7eiNgB6gTxxwjtmd") {
      console.log(data, rgb, req.body);
    }
    switch (data.type) {
      case "svr":
        const cookie = req.headers['cookie'];

        const cfBmCookie = parseCookie(cookie, "__cf_bm");
        const cfBmExists = cfBmCookie ? true : false;
        const _vid_t = parseCookie(cookie, "_vid_t");
        const vidtExists = _vid_t ? true : false;
        if (data._ckey !== rgb.decryptedClientKey) {
          console.log(`[WRONG CLIENT KEY]: ${data._ckey} != ${rgb.decryptedClientKey} ${ip} | [${data._i}]: \x1b[0m ${cfBmExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'} ${vidtExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`);

          return res.sendStatus(400);
        }


        if (!data.server) {

          console.log(`Wrong Server! ${ip} | [${data._i}]: \x1b[0m ${cfBmExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'} ${vidtExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`);

          return res.sendStatus(400);
        }

        rgb.server = data.server;


        return res.sendStatus(200);
      default:
        break;
    }
    if (data && data.type != "svr") {

      const rgb = socketHandler.userKeyPairs.get(userId);


      if (!rgb.removed) {
        fs.unlinkSync(rgb.path)
        rgb.removed = true;
      };
      const origin = req.headers['origin'];
      const cookie = req.headers['cookie'];
      const cfRay = req.headers['cf-ray'];

      const browserInfo = `${data._o._b}, ${data._o._v}`;
      const visitorId = data._i;
      const currentTime = Date.now();
      const cfBmCookie = parseCookie(cookie, "__cf_bm");
      const cfBmExists = cfBmCookie ? true : false;
      const _vid_t = parseCookie(cookie, "_vid_t");
      const vidtExists = _vid_t ? true : false;

      const time = socketHandler.restoreNumber(data._v[1], data._v[0]);
      if (!data._o._s) {
        const logString = `\x1b[90m[${socketHandler.formatTime(currentTime)}]\x1b[0m \x1b[31m[BLOCK]\x1b[0m \x1b[31m[${ip}]\x1b[0m \x1b[34m[${visitorId}]\x1b[0m \x1b[37m[${browserInfo}]: \x1b[33m${data._v[0]} ${data._v[1].length} ${data._v.length} ${contentLength} ${origin} ${cfRay} ${data._o._s}\x1b[0m ${cfBmExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'} ${vidtExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`;
        console.log(logString);
        return res.sendStatus(400);
      }
      else if (!socketHandler.logMap.has(userId)) {
        socketHandler.logMap.set(userId, currentTime);
        const logString = `\x1b[90m[${socketHandler.formatTime(currentTime)}]\x1b[0m \x1b[33m[POST]\x1b[0m \x1b[31m[${ip}]\x1b[0m \x1b[34m[${visitorId}]\x1b[0m \x1b[37m[${browserInfo}, ${data._w}, ${data._h}]: \x1b[33m${data._v[0]} ${data._v[1].length} ${time} ${data._v.length} ${contentLength} ${origin} ${cfRay} ${data._o._s}\x1b[0m ${cfBmExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'} ${vidtExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`;
        console.log(logString);
      } else {
        const logString = `\x1b[90m[${socketHandler.formatTime(currentTime)}]\x1b[0m \x1b[33m[POST]\x1b[0m \x1b[31m[${ip}]\x1b[0m \x1b[34m[${visitorId}]\x1b[0m \x1b[37m[${browserInfo}, ${data._w}, ${data._h}]: \x1b[33m${data._v[0]} ${data._v[1].length} ${time} ${data._v.length} ${contentLength} ${origin} ${cfRay} ${data._o._s}\x1b[0m ${cfBmExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'} ${vidtExists ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`;
        console.log(logString);
      }


      if (!userId) {
        return res.sendStatus(201)
      };
      if (!rgb.userId) rgb.userId = req.query.userId;
      if (!rgb.ip) rgb.ip = ip;

      if (Object.keys(data).length != 5) {
        console.log(`Illegal Object`, Object.keys(data).length)
        return res.sendStatus(400);
      }

      if (!data._v || data._v.length < 2) {
        console.log(`No Time or Length < 1`, !data._v, data._v.length < 2);
        return res.sendStatus(400);
      }
      if (data._v.length == 2) {
        const token = socketHandler.generateToken(60);
        console.log(token);
        socketHandler.socket.send(JSON.stringify([
          205,
          rgb.server,
          token,
          data._w + 200,
          data._h + 200,
          ip
        ]));

        const responseData = {
          _token: token,
        };
        const encryptedResponseData = crypto.publicEncrypt(
          {
            key: rgb.clientPublicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
          },
          Buffer.from(JSON.stringify(responseData))
        ).toString('base64');
        res.send(encryptedResponseData);
      }

      decryptedData.ip = ip;
      decryptedData.visitorId = visitorId;

      fs.appendFile('log.txt', decryptedData.toString() + '\n', (err) => {
        if (err) {
          console.error('Error logging data:', err);
        }
      });
    }
  } catch (err) {

    if (data._i == "btHM7eiNgB6gTxxwjtmd") console.log(err);
    return res.sendStatus(400);
  }
});

app.use(express.static("public"));
app.listen(3001, '0.0.0.0', () => {
  console.log("[Client] Listening within 3001");
});
