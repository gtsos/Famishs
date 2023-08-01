
(async function () {
    await new Promise(resolve => {
        const checkVisitorId = async () => {
            if (window.gbRes && window.gbRes.visitorId) {
                clearInterval(interval);

                start();

                function makeid(length) {
                    let result = '';
                    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    const charactersLength = characters.length;
                    let counter = 0;
                    while (counter < length) {
                      result += characters.charAt(Math.floor(Math.random() * charactersLength));
                      counter += 1;
                    }
                    return result;
                }
                

                window.crypton = makeid(25);

                async function start() {

                    let unuqie_code = "NEED_TO_REPLACE";

                    let checked = false;

                    const { publicKey, privateKey } = await window.crypto.subtle.generateKey(
                        {
                            name: 'RSA-OAEP',
                            modulusLength: 2048,
                            publicExponent: new Uint8Array([1, 0, 1]),
                            hash: 'SHA-256',
                        },
                        true,
                        ['encrypt', 'decrypt']
                    );

                    const exportedPublicKey = await window.crypto.subtle.exportKey(
                        'spki',
                        publicKey
                    );
                    const encodedPublicKey = arrayBufferToBase64(exportedPublicKey);

                    const { pemPublicKey, userId } = await getPemPublicKey();
                    const importedPublicKey = await importPublicKey(pemPublicKey);

                    const dataPromise = sendCloudfalre(userId, importedPublicKey);
                    const data = await dataPromise;
                    const encryptedData = JSON.parse(data).encrypted_response_data;

                    const decryptedArrayBuffer = await window.crypto.subtle.decrypt(
                        {
                            name: 'RSA-OAEP',
                        },
                        privateKey,
                        base64ToArrayBuffer(encryptedData)
                    );


                    const decryptedDataString = new TextDecoder().decode(decryptedArrayBuffer);
                    const decryptedObject = JSON.parse(decryptedDataString);


                    await addScript(decryptedObject.message);
                    tri(decryptedObject.message);
                    const cpubKeyArray = await window.crypto.subtle.decrypt(
                        {
                            name: 'RSA-OAEP',
                        },
                        privateKey,
                        base64ToArrayBuffer(window.clientKey)
                    );

                    const decryptedClientKey = new TextDecoder().decode(cpubKeyArray);

                    const clientKey = JSON.parse(decryptedClientKey);


                    async function getPemPublicKey() {
                        const response = await fetch('/get-public-key');
                        const data = await response.json();
                        const pemPublicKey = data.publicKey;
                        const userId = data.userId;
                        return { pemPublicKey, userId };
                    }

                    async function importPublicKey(pem) {
                        const pemHeader = "-----BEGIN PUBLIC KEY-----";
                        const pemFooter = "-----END PUBLIC KEY-----";
                        const pemContents = pem.replace(pemHeader, "").replace(pemFooter, "").replaceAll("\n", "");
                        const binaryDerString = window.atob(pemContents);
                        const binaryDer = str2ab(binaryDerString);

                        return window.crypto.subtle.importKey(
                            "spki",
                            binaryDer,
                            {
                                name: "RSA-OAEP",
                                hash: "SHA-256",
                            },
                            true,
                            ["encrypt"]
                        );
                    }

                    function arrayBufferToBase64(buffer) {
                        let binary = '';
                        const bytes = new Uint8Array(buffer);
                        const len = bytes.byteLength;
                        for (let i = 0; i < len; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        return window.btoa(binary);
                    }

                    function base64ToArrayBuffer(base64) {
                        const binaryString = window.atob(base64);
                        const len = binaryString.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; ++i) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        return bytes.buffer;
                    }

                    function addScript(src) {
                        return new Promise((resolve, reject) => {
                            var script = document.createElement('script');
                            script.src = src;
                            script.async = true;
                            script.onload = () => resolve(script);
                            script.onerror = () => reject(new Error(`Script load error for ${src}`));
                            document.head.appendChild(script);
                        });
                    }

                    let decoder = new TextDecoder();
                    let infinity = Infinity;
                    let sCount = 0;

                    function disable() {
                        for (let i = 0; i < infinity; i++) {
                            sCount++;
                        }
                    }

                    function joinNumbers(str) {
                        let arr = [];
                        for (let i = 0; i < str.length; i++) {
                            if (isNaN(str[i])) continue;

                            arr.push(str[i]);
                            while (!isNaN(str[i + 1])) {
                                arr[arr.length - 1] += str[i += 1];
                            }
                        }
                        return arr;
                    }

                    function reverseString(str) {
                        str = String(str);
                        let splitString = str.split("");
                        let reverseArray = splitString.reverse();
                        let joinArray = reverseArray.join("");
                        return joinArray;
                    }

                    function handleMessage(msgData) {
                        let data = msgData;
                        if (typeof data === "string") {
                            data = JSON.parse(data);

                            switch (data[0]) {
                                case 19:
                                    let string = data[1];
                                    string = joinNumbers(string);
                                    string = string.reverse();
                                    string = decoder.decode(new Uint8Array(string));
                                    string = reverseString(string);
                                    window.crypton = string;
                                    break;
                            }
                        }
                    }

                   
                    let get = "get";
                    let set = "set";

                    let wsCounter = 0;
                    let construct = 'construct';

                    let pr = Proxy;

                    window.WebSocket = new Proxy(window.WebSocket, {
                        [construct]: (target, args) => {
                            const ws = new target(...args);
                            let wsCounter = 0;
                    
                            ws.addEventListener("open", () => {
                                wsCounter += 1;
                            });
                    
                            ws.addEventListener("close", () => {
                                wsCounter -= 1;
                            })
                    
                            ws.addEventListener("message", msg => {
                                handleMessage(msg.data);
                            })
                            ws.send = new pr(ws.send, {
                                apply(target, _this, args) {
                                    let data = JSON.parse(args[0]);

                                    if(data[0] === 102) {
                                        if(getNow() - lastClicked > 10){
                                            return;
                                        }
                                    }

                                    return target.apply(_this, args);
                                }
                            })
                    
                            return ws;
                        }
                    });

                    function getNow() {
                        return +new Date();
                    }

                    let lastClicked = -1;

                    window.addEventListener("mousedown", () => {
                        lastClicked = getNow();
                    })
                    

                    Object.defineProperty(Object.prototype, "setWalkableAt", {
                        [get]: () => {
                            disable();
                        },
                    });

                    Object.defineProperty(Object.prototype, "ComponentManager", {
                        [set]: () => {
                            disable();
                        }
                    });

                    window.Proxy = null;


                    if (typeof GM_info !== "undefined") {
                        setInterval();
                    }

                    for (const item in window.localStorage) {
                        window.localStorage.removeItem(item);
                    }
                    function str2ab(str) {
                        const buf = new ArrayBuffer(str.length); // 2 bytes for each char
                        const bufView = new Uint8Array(buf);
                        for (let i = 0, strLen = str.length; i < strLen; i++) {
                            bufView[i] = str.charCodeAt(i);
                        }
                        return buf;
                    }


                    async function encryptData(publicKey, data) {
                        const encoder = new TextEncoder();
                        const encodedData = encoder.encode(JSON.stringify(data));
                        return window.crypto.subtle.encrypt(
                            {
                                name: "RSA-OAEP",
                            },
                            publicKey,
                            encodedData
                        );
                    }


                    function sendEncryptedData(encryptedData, userId, p) {
                        return new Promise((resolve, reject) => {
                            const xhr = new XMLHttpRequest();


                            xhr.open('POST', p);
                            xhr.setRequestHeader('Content-Type', 'application/json');

                            xhr.onload = function () {
                                if (xhr.status === 200) {
                                    resolve(xhr.responseText);
                                } else if(xhr.status == 201) {
                                    window.location.reload();
                                }else {

                                    if (xhr.status == 400 && p == "/cloudflare") {
                                        setTimeout(() => { window.location.reload() }, 3000);
                                    }

                                    resolve(xhr.statusText);
                                }
                            };

                            xhr.onerror = function () {
                                reject(Error('Network Error'));
                            };



                            const requestBody = JSON.stringify({
                                userId,
                                p: encodedPublicKey,
                                encrypted_data: arrayBufferToBase64(encryptedData),
                            });

                            xhr.send(requestBody);
                        });
                    }


                    function shuffleArrayWithIndices() {
                        const currentDate = Date.now();
                        const numberString = currentDate.toString();
                        const charArray = Array.from(numberString);
                        const indexCharPairs = charArray.map((char, index) => [index, char]);

                        for (let i = indexCharPairs.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [indexCharPairs[i], indexCharPairs[j]] = [indexCharPairs[j], indexCharPairs[i]];
                        }

                        const shuffledIndices = indexCharPairs.map(([index, _]) => index);
                        const shuffledChars = indexCharPairs.map(([_, char]) => char);
                        return [shuffledChars.join(''), shuffledIndices]
                    }


                    async function _sciene_req(userId) {
                        const userAgent = navigator.userAgent;
                        let browserVersion = "";

                        const browserMatch = userAgent.match(/(Chrome|Safari|Firefox|Edge)\/([\d.]+)/);
                        const browser = browserMatch ? browserMatch[1] : null;
                        if (/rv:([^\)]+)\) Gecko\/\d{8}/.test(userAgent)) {
                            browserVersion = userAgent.match(/rv:([^\)]+)\) Gecko\/\d{8}/)[1];
                        } else if (/MSIE ([^;]+)/.test(userAgent)) {
                            browserVersion = userAgent.match(/MSIE ([^;]+)/)[1];
                        } else if (/Edge\/(\d+)\./.test(userAgent)) {
                            browserVersion = userAgent.match(/Edge\/(\d+)\./)[1];
                        } else if (/Chrome\/(\d+)\./.test(userAgent)) {
                            browserVersion = userAgent.match(/Chrome\/(\d+)\./)[1];
                        } else if (/Version\/(\d+)\./.test(userAgent)) {
                            browserVersion = userAgent.match(/Version\/(\d+)\./)[1];
                        } else if (/Firefox\/(\d+)\./.test(userAgent)) {
                            browserVersion = userAgent.match(/Firefox\/(\d+)\./)[1];
                        }


                        let lenght = await getFileSize(decryptedObject.message);
                        if (checked) lenght = 200;
                        checked = true;
                        const obj = {
                            _w: screen.width,
                            _h: screen.height,
                            _v: shuffleArrayWithIndices(),
                            _o: {
                                _s: lenght,
                                _b: browser,
                                _v: browserVersion,
                            },
                            _i: gbRes.visitorId,
                        }
                        return obj;
                    }

                    let counter = [];

                    async function sendData(link) {

                        counter.push(Date.now());

                        counter.forEach((count) => {
                        let index = counter.indexOf(count);
                        if(Date.now() - count > 10000) counter.splice(index, 1);
                        })

                        if(counter.length > 25) return;

                        await sendServer(link, userId, importedPublicKey);
                        const data = await _sciene_req();
                        const encryptedData = await encryptData(importedPublicKey, data);
                        const enc_data = await sendEncryptedData(encryptedData, userId, '/science');
                        const decryptedArrayBuffer = await window.crypto.subtle.decrypt(
                            {
                                name: 'RSA-OAEP',
                            },
                            privateKey,
                            base64ToArrayBuffer(enc_data)
                        );

                        const decryptedDataString = new TextDecoder().decode(decryptedArrayBuffer);
                        const decryptedObject = JSON.parse(decryptedDataString)._token;
                        window._token = decryptedObject;
                    }

                    async function sendServer(link, userId, publicKey) {
                        const data = {
                            server: `${link}`,
                            type: "svr",
                            _i: gbRes.visitorId,
                            _ckey: clientKey,
                            userId
                        }
                        const encryptedData = await encryptData(publicKey, data);
                        await sendEncryptedData(encryptedData, userId, '/science');
                    }

                    async function sendCloudfalre(userId, publicKey) {
                        const data = {
                            _i: gbRes.visitorId,
                            userId,
                            _u: unuqie_code,
                            _v: shuffleArrayWithIndices(),
                        }
                        const encryptedData = await encryptData(publicKey, data);
                        return await sendEncryptedData(encryptedData, userId, '/cloudflare');
                    }


                    window.sendData = sendData;


                    function tri(y) {
                        fetch(y)
                            .then(response => {
                            })
                            .catch((err) => {
                                alert('Cheat detection');

                                window.location.href = "https://mirror.famishs.io";
                            });
                    }
                    async function getFileSize(url) {
                        try {
                            const response = await fetch(url);
                            const contentLength = response.headers.get('Content-Length');
                            if (contentLength) {
                                const fileSizeInBytes = parseInt(contentLength);
                                return fileSizeInBytes;
                            } else {
                                if (response.status == 200) return 200;
                                return 0;
                            }
                        } catch (error) {
                            if (checked) return 200;
                            window.location.href = 'https://mirror.famishs.io';
                        }
                    }
                    resolve();
                }
            }

        };
        const interval = setInterval(checkVisitorId, 100);
        checkVisitorId();

    });

})();