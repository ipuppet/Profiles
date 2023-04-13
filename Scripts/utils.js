class Storage {
    constructor() {
        this.keyPrefix = ""
        this.empty = [undefined, null, ""]
    }

    /**
     * 增加一个空集元素
     * @param {*} empty
     * @returns this
     */
    addEmpty(empty) {
        this.empty.push(empty)
        return this
    }

    /**
     * 设置空集
     * @param {Array} empty
     * @returns this
     */
    setEmpty(empty) {
        this.empty = empty
        return this
    }

    /**
     * item 为空则返回 true
     * @param {*} item
     * @returns {Boolean}
     */
    isEmpty(item) {
        if (item instanceof Array) {
            return item.length === 0
        } else if (typeof item === "object") {
            return Object.keys(item).length === 0
        } else {
            return this.empty.includes(item)
        }
    }

    /**
     * 设置 key 前缀
     * @param {String} keyPrefix
     * @returns this
     */
    setKeyPrefix(keyPrefix) {
        this.keyPrefix = keyPrefix
        return this
    }

    /**
     * 获取数据
     * @param {String} key 键
     * @param {*} _default 未找到时的默认值，默认为 null
     * @param {Boolean} jsonDecode 是否需要 json 解码
     * @returns {*}
     */
    get(key, _default = null, jsonDecode = false) {
        let value = $persistentStore.read(this.keyPrefix + key)
        if (jsonDecode) value = JSON.parse(value)
        return this.isEmpty(value) ? _default : value
    }

    /**
     * 写入数据
     * @param {*} value
     * @param {String} key
     */
    set(key, value) {
        if (typeof value === "object") {
            value = JSON.stringify(value)
        }
        return $persistentStore.write(value, this.keyPrefix + key)
    }
}

/**
 * 网络请求封装为 Promise
 * Usage: Http.get(option).then(response => { console.log(data) }).catch(error => { console.log(error) })
 * Usage: Http.post(option).then(response => { console.log(data) }).catch(error => { console.log(error) })
 * response: { status, header, data }
 */
class Http {
    /**
     * 回调函数
     * @param {*} resolve
     * @param {*} reject
     * @param {*} error
     * @param {*} response
     * @param {*} data
     */
    static _httpRequestCallback(resolve, reject, error, response, data) {
        if (error) {
            reject(error)
        } else {
            resolve(Object.assign(response, { data }))
        }
    }

    static _requestSyun(req) {
        let response
        let error

        req.then(resp => {
            response = resp
        }).catch(err => {
            error = err
        })

        while (!response && !error) {}

        if (error) throw error

        return response
    }

    /**
     * HTTP GET SYNC
     * @param {Object} option 选项
     * @returns
     */
    static getSync(option = {}) {
        const req = new Promise((resolve, reject) => {
            $httpClient.get(option, (error, response, data) => {
                this._httpRequestCallback(resolve, reject, error, response, data)
            })
        })

        return this._requestSyun(req)
    }

    /**
     * HTTP POST SYNC
     * @param {Object} option 选项
     * @returns
     */
    static postSync(option = {}) {
        const req = new Promise((resolve, reject) => {
            $httpClient.post(option, (error, response, data) => {
                this._httpRequestCallback(resolve, reject, error, response, data)
            })
        })

        return this._requestSyun(req)
    }

    /**
     * HTTP GET
     * @param {Object} option 选项
     * @returns
     */
    static get(option = {}) {
        return new Promise((resolve, reject) => {
            $httpClient.get(option, (error, response, data) => {
                this._httpRequestCallback(resolve, reject, error, response, data)
            })
        })
    }

    /**
     * HTTP POST
     * @param {Object} option 选项
     * @returns
     */
    static post(option = {}) {
        return new Promise((resolve, reject) => {
            $httpClient.post(option, (error, response, data) => {
                this._httpRequestCallback(resolve, reject, error, response, data)
            })
        })
    }
}

/**
 * 日志生成
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

class SurgeAPI {
    static get(path) {
        return new Promise((resolve, reject) => {
            $httpAPI("get", path, null, result => {
                resolve(result)
            })
        })
    }

    static post(path, data) {
        if (typeof data === "string") {
            data = JSON.parse(data)
        }
        return new Promise((resolve, reject) => {
            $httpAPI("post", path, data, result => {
                resolve(result)
            })
        })
    }
}

class OutboundMode {
    name
    surge
    loon

    constructor({ name, surge, loon } = {}) {
        this.name = name
        this.surge = surge
        this.loon = loon
    }

    static get GlobalDirect() {
        return new OutboundMode({
            name: "全局直连",
            surge: "direct",
            loon: 0
        })
    }

    static get ByRule() {
        return new OutboundMode({
            name: "自动分流",
            surge: "rule",
            loon: 1
        })
    }

    static get GlobalProxy() {
        return new OutboundMode({
            name: "全局代理",
            surge: "global-proxy",
            loon: 2
        })
    }

    get mode() {
        if (Utils.isSurge) {
            return this.surge
        } else if (Utils.isLoon) {
            return this.loon
        }

        throw "Currently only Surge and Loon are supported"
    }

    /**
     * 将 OutboundMode 转换为文本用于展示
     * @param {OutboundMode} mode
     * @returns
     */
    toString() {
        return this.name
    }

    set() {
        if (Utils.isSurge) {
            $surge.setOutboundMode(this.mode)
        } else if (Utils.isLoon) {
            Utils.loonConfig.setRunningModel(this.mode)
        }
    }
}

class Argument {
    args = {}

    constructor() {
        if (typeof $argument !== "undefined") {
            this.args = Object.fromEntries($argument.split("&").map(item => item.split("=")))
        }

        Object.keys(this.args).map(key => {
            if (this.args[key] === "true") {
                this.args[key] = true
            } else if (this.args[key] === "false") {
                this.args[key] = false
            } else if (!isNaN(this.args[key])) {
                this.args[key] = Number(this.args[key])
            }
        })
    }

    get(key) {
        return this.args[key]
    }

    static all() {
        return new Argument().args
    }
}

class Utils {
    static get isSurge() {
        try {
            return $surge !== undefined
        } catch {
            return false
        }
    }
    static get isLoon() {
        try {
            return $loon !== undefined
        } catch {
            return false
        }
    }

    static get loonConfig() {
        try {
            return $config
        } catch (error) {
            return {}
        }
    }

    /**
     * 发送通知
     * @param {String} title
     * @param {String} subtitle
     * @param {String} body
     */
    static notification(title, subtitle, body) {
        $notification.post(title, subtitle, body)
    }

    static async policies() {
        if (this.isSurge) {
            return await SurgeAPI.get("/v1/policies")
        } else if (this.isLoon) {
            return JSON.parse(this.loonConfig.getConfig()).all_policy_groups
        }
    }

    /**
     * 切换策略组策略
     * @param {String} group 策略组
     * @param {String} policy 待选策略
     */
    static setSelectGroupPolicy(group, policy) {
        if (this.isSurge) {
            $surge.setSelectGroupPolicy(group, policy)
        } else if (this.isLoon) {
            this.loonConfig.setSelectPolicy(group, policy)
        }
    }

    static get ssid() {
        if (this.isSurge) {
            return $network?.wifi?.ssid ?? ""
        } else if (this.isLoon) {
            return JSON.parse(this.loonConfig.getConfig()).ssid
        }
    }
}
