OTP-WhatsApp V.1.0

Tools ini di buat untuk memudahkan mengirim otp via whatsapp menggunakan API nodejs (whatsapp-web.js
),sudah di lengkapi dengan API-KEY yang di generate di backend dan disimpan di
supabase sebagi databse untuk menampung dan menyimpan api key yang di gunakan

bisa di jalankan di HEROKU
----------------------------------------------------------------------------------------------------
demo : https://otp-whatsapp.herokuapp.com/apps

******| HEROKU |******

- Deploy Apikasi ke heroku
- Tambahkan puppeter di build pack https://buildpack-registry.s3.amazonaws.com/buildpacks/jontewks/puppeteer.tgz
- build empty commit git commit --allow-empty -am "Redeploy to heroku: add buildpack for puppeter"

******| SUPABSE |******

- Edit .env file di folder root
   API_URL = "YOUR_API_URL_SUPABASE"
   API_KEY = "YOUR_API_KEY_SUPABSE"


******| DOCS |******

- Send Message tanpa api key
POST http://localhost:3000/api/v1/send-msg HTTP/1.1
Content-Type: application/json

{
    "number": "088xxxxxxxx",
    "message": "test otp api v1"
}

- send Message dengan api key
POST http://localhost:3000/api/v2/send-msg HTTP/1.1
Content-Type: application/json

{
    "number": "088xxxxxxxx",
    "message": "test otp api v2",
    "api_key": "1e857623-52a7-47f8-b3f3-161802e3bd42"
}

