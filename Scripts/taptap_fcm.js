/**
 * Surge script
 * 适用于：少年的人间奇遇
 * url match: https://(api\-sdk|openapi)\.(xd|taptap)\.com/(v\d/(fcm|user|sdk)|account/profile/v1)•*
 * mitm: api-sdk.xd.com, openapi.taptap.com
 */

class Logger {
    static id = this.randomString()

    static randomString(e = 6) {
        let t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
            a = t.length,
            n = ""
        for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a))
        return n
    }

    static log(message) {
        message = `[${this.id}] [ LOG ] ${message}`
        console.log(message)
    }

    static error(message) {
        message = `[${this.id}] [ERROR] ${message}`
        console.log(message)
    }
}

class UrlMatcher {
    static GET = "GET"
    static POST = "POST"
    static PUT = "PUT"
    static DELETE = "DELETE"

    static URL = $request.url
    static METHOD = $request.method

    urls = []

    constructor(urls = []) {
        this.urls = urls
    }

    static isMatch(url) {
        return this.URL.indexOf(url) !== -1
    }

    get(url, callback) {
        this.urls.push({
            url,
            method: UrlMatcher.GET,
            callback
        })
    }

    post(url, callback) {
        this.urls.push({
            url,
            method: UrlMatcher.POST,
            callback
        })
    }

    match() {
        for (let i = 0; i < this.urls.length; ++i) {
            if (UrlMatcher.isMatch(this.urls[i].url) && UrlMatcher.METHOD === this.urls[i].method) {
                this.urls[i].callback((body, status, headers = {}) => {
                    if (typeof body === "object") {
                        try {
                            body = JSON.stringify(body)
                            headers["content-type"] = "application/json"
                        } catch {}
                    }
                    const response = { body, headers }
                    if (status) {
                        response.status = status
                    }
                    $done({ response })
                })
                break
            }
        }
    }
}

const um = new UrlMatcher()

// https://api-sdk.xd.com
um.get("/v2/user", response => {
    response({
        anti_addiction_token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJiaXJ0aGRheSI6IjE5OTAtMDUtMDkiLCJ1bmlxdWVfaWQiOiIxNjQyZDlhMDBhMWM2YjA2NjY0ZjUzYjEwMjk0MTA5ZiIsInVzZXJfaWQiOiI3NmVhNzdmOWQ0ZTZkMjM2ZjhlMzFkMDc3NzEwNjAyMyJ9.EFxHmGiSTAn3ei1tCvaXw4Nfp51s_X0-NVRYX1lBtGw", // 无意义 token
        ip: "123.123.123.100",
        did: "4a440bac-343c-4b52-bd9a-46b4c09da4a1", // uuid
        site: "9",
        friendly_name: "taptap",
        nickname: null,
        is_anonymous: 0,
        game: "sndrjqy",
        id_card: "210203xxxxxxxx18",
        taptap_nickname: "taptap",
        tmp_to_xd: true,
        last_login: 0,
        authoriz_state: 0,
        name: "taptap",
        userInfo: {
            idCardNumber: "",
            mobile: "",
            fullName: ""
        },
        restrictData: {
            code: 200,
            restrictType: 0,
            remainTime: 0,
            title: "健康游戏提示",
            description: "当前为成年人账号"
        },
        taptap_avatar:
            "https://img3.tapimg.com/default_avatars/2e37ca25ddfc668fe5ef1265689e5868.jpg?imageMogr2/auto-orient/strip/thumbnail/!300x300r/gravity/Center/crop/300x300/format/jpg/interlace/1/quality/80",
        id: "206854125", // 9 位
        phone: "",
        fcm: 4,
        client_id: "klsupf5weuc5ady", // 15 位
        is_upload_play_log: 0,
        adult_type: 0,
        tds_user_id: "",
        safety: true,
        privacy_agreement: 0,
        taptap_id: "503762543", // 9 位
        created: 1666700000
    })
})
um.post("/v3/fcm/authorizations", response => {
    response({
        code: 200,
        msg: "授权成功",
        data: {
            access_token:
                "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZWVjNmI1Mjg5OTFjM2QyNzg2YjY2YmI3N2RjNzQ1YmIiLCJleHAiOjE2NjY3ODk2ODQsImlhdCI6MTY2Njc4OTY4NH0.IB4z28mkdozJYlH-Ym9qpLzHz5aKOkZwkEED2iYFRcQ", // 无意义 JWT
            user_id: "eec6b528991c3d2786b66bb77dc745bb", // 32 位
            type: 4 // 实名类型 1：8岁以下，2：8-15岁，3：16-17岁，4：18+ 5：未实名
        }
    })
})
um.post("/v3/fcm/set_play_log", response => {
    response({
        code: 200,
        msg: "上传时间成功",
        data: {
            remainTime: 0, // 防沉迷剩余时间，单位秒
            costTime: 3600, // 今日游戏已玩时长，单位秒
            restrictType: 0, // 0-不限制 1-宵禁 2-未实名
            title: "健康游戏提示",
            description: "当前为成年人账号"
        }
    })
})
um.get("/v3/fcm/get_server_time", response => {
    response({ timestamp: Math.round(new Date().getTime() / 1000) })
})
um.get("/v3/sdk/get_ad_parameter", response => {
    response([])
})
um.get("/v1/user/get_login_url", response => {
    response({ login_url: "https://www.xd.com" })
})

// https://openapi.taptap.com
um.get("/account/profile/v1", response => {
    response({
        now: Math.round(new Date().getTime() / 1000),
        data: {
            gender: "",
            is_certified: false,
            openid: "dnhoZjV1eVByaS81bnRHVg==", // 16 位随机字符 [A-Za-z0-9+/=]，base64 后的结果 (24 位)
            unionid: "ZHFxWmc0Mk5oZkt3UzdxMw==", // 16 位随机字符 [A-Za-z0-9+/=]，base64 后的结果 (24 位)
            name: "taptap",
            avatar: "https://img3.tapimg.com/default_avatars/2e37ca25ddfc668fe5ef1265689e5868.jpg?imageMogr2/auto-orient/strip/thumbnail/!300x300r/gravity/Center/crop/300x300/format/jpg/interlace/1/quality/80"
        },
        success: true
    })
})

um.match()
$done({})
