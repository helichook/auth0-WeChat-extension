//https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
const MINI_PROGRAM_TOKEN= "https://api.weixin.qq.com/sns/jscode2session?grant_type=authorization_code"


var express = require('express');
var Webtask = require('webtask-tools');
var bodyParser = require('body-parser');
const axios = require("axios").default;
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/.well-known/openid-configuration', (req, res) => {
    const wtUrl = `https://${req.headers.host}/auth0-wechat-extension`;
    res.status(200).send({
        "authorization_endpoint": `${wtUrl}/authorize`,
        "token_endpoint": `${wtUrl}/token`
    });
});

app.post('/token', async function (req, res) {
    const context = req.webtaskContext;
    const { client_id, client_secret, code, code_verifier, redirect_uri } = req.body;
    if (!client_id || !client_secret) {
        return res.send(400, 'missing client_id / client_secret');
    }
    if (context.data.AUTH0_CLIENT_ID === client_id && context.data.AUTH0_CLIENT_SECRET === client_secret) {
        var options = {
            method: 'GET',
            url: MINI_PROGRAM_TOKEN+`&appid=${context.data.WeChat_CLIENT_ID}&secret=${context.data.WeChat_CLIENT_SECRET}&js_code=${code}`,
        };
        try {
            const response = await axios.request(options);
            return res.status(200).send(response.data);

        } catch (error) {
            if (error.response) {
                return res.status(error.response.status).send(error.response.data);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', error.message);
                return res.status(500).send(error);
            }
        }
    } else {
        return res.send(401, 'invalid request');
    }
});

app.post('/verify', async function (req, res) {
    try {
        const { id_token } = response.body;
        if (!id_token) {
            return res.status(400).send('ID_TOKEN required');
        }
        const publicKey = await loadPublicKey(context.data);
        const { payload, protectedHeader } = await jwtVerify(id_token, publicKey, {
            issuer: context.data.ISSUER,
            audience: context.data.CLIENT_ID
        })
        return res.status(200).send(payload);
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).send(error.response.data);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
            return res.status(500).send(error);
        }
    }
})


module.exports = Webtask.fromExpress(app);
