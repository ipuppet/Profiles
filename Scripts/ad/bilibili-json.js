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

if ($response.body === undefined) {
    // 有 undefined 的情况
    Logger.log("$response.body undefined: ")
    Logger.log($request.url)
    $done({})
}

function fixPos(arr) {
    for (let i = 0; i < arr.length; i++) {
        // 修复pos
        arr[i].pos = i + 1
    }
}

let body = JSON.parse($response.body)

/**
 * source: https://raw.githubusercontent.com/app2smile/rules/master/js/bilibili-json.js
 */
if (body.hasOwnProperty("data")) {
    const um = new UrlMatcher()

    // 开屏页
    um.get("x/v2/splash", () => {
        Logger.log("开屏页 " + (UrlMatcher.isMatch("splash/show") ? "show" : "list"))
        if (body.data.hasOwnProperty("show")) {
            delete body.data.show
            Logger.log("去除开屏页")
        }
    })
    // tab 修改
    um.get("resource/show/tab/v2", () => {
        // 顶部右上角
        if (body.data.hasOwnProperty("top")) {
            body.data.top = body.data.top.filter(item => {
                // 去除右上角游戏中心
                if (item.name === "游戏中心") {
                    Logger.log("去除游戏中心")
                    return false
                }
                return true
            })
            fixPos(body.data.top)
        }
        // 底部 tab 栏
        /* if (body.data.hasOwnProperty("bottom")) {
            body.data.bottom = body.data.bottom.filter(item => {
                if (item.name === "发布") {
                    Logger.log("去除发布")
                    return false
                } else if (item.name === "会员购") {
                    Logger.log("去除会员购")
                    return false
                }
                return true
            })
            fixPos(body.data.bottom)
        } */
    })
    // 推荐页
    um.get("x/v2/feed/index", () => {
        Logger.log("推荐页")
        if (body.data.hasOwnProperty("items")) {
            body.data.items = body.data.items.filter(i => {
                if (i.hasOwnProperty("card_type") && i.hasOwnProperty("card_goto")) {
                    const cardType = i.card_type
                    const cardGoto = i.card_goto
                    if (cardType === "banner_v8" && cardGoto === "banner") {
                        if (i.hasOwnProperty("banner_item")) {
                            for (const v of i.banner_item) {
                                if (v.hasOwnProperty("type")) {
                                    if (v.type === "ad") {
                                        Logger.log("去除 banner 广告")
                                        return false
                                    }
                                }
                            }
                        }
                    } else if (
                        cardType === "cm_v2" &&
                        ["ad_web_s", "ad_av", "ad_web_gif", "ad_player"].includes(cardGoto)
                    ) {
                        // ad_player大视频广告 ad_web_gif大gif广告 ad_web_s普通小广告 ad_av创作推广广告
                        Logger.log(`去除 ${cardGoto} 广告)`)
                        return false
                    } else if (cardType === "small_cover_v10" && cardGoto === "game") {
                        Logger.log("去除游戏广告")
                        return false
                    } else if (cardType === "cm_double_v9" && cardGoto === "ad_inline_av") {
                        Logger.log("去除创作推广-大视频广告")
                        return false
                    }
                }
                return true
            })
        }
    })

    um.match()
}

$done({ body: JSON.stringify(body) })
