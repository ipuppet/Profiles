/**
 * 根据 SSID 自动更改策略组和 Outbound Mode
 *
 * Author: ipuppet
 * GitHub: https://github.com/ipuppet/Profiles/blob/master/Scripts/ssid.js
 */

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

class SurgeAPI {
    static get(path) {
        return new Promise((resolve, reject) => {
            $httpAPI("get", path, {}, result => {
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

const NotificationMode = {
    None: 0, // 关闭通知
    All: 1, // 所有通知
    Matched: 2, // 匹配到配置
    NotMatched: 3 // 未匹配到配置
}

class SSID {
    ssid = Utils.ssid

    /**
     * 配置通知
     * @param {Number} notification NotificationMode
     * @returns this
     */
    setNotification(notification) {
        this.notification = notification

        return this
    }

    _isNotification() {
        if (this.notification === NotificationMode.All) return true
        if (this.notification === NotificationMode.None) return false
        const mode = this._getMode()
        if (mode === this.default) {
            if (this.notification === NotificationMode.NotMatched) return true
        } else if (this.notification === NotificationMode.Matched) {
            return true
        }

        return false
    }

    /**
     * 配置某网络下的运行模式
     * @param {Object} ssidConfig 格式如下：
     * "ssid名称": {
     *     outboundMode: OutboundMode, // 运行模式
     *     selectPolicy: { // 设置策略
     *         "Proxy": "DIRECT", // 节点或其他策略明称，如：'日本 1.5x'、'自动测试'
     *         "Google": "Proxy", // 将名称为 Google 的策略改为 Proxy
     *         "Telegram": "Proxy", // 将名称为 Telegram 的策略改为 Proxy
     *     }
     * }
     * @returns this
     */
    setSSIDConfig(ssidConfig) {
        Object.keys(ssidConfig).forEach(ssid => {
            if (typeof ssidConfig[ssid].outboundMode === "string") {
                ssidConfig[ssid].outboundMode = OutboundMode[ssidConfig[ssid].outboundMode]
            }
        })
        this.modeList = ssidConfig

        return this
    }

    /**
     * 所有未配置的网络更改均走此配置
     * @param {Object} defaultMode
     * @returns this
     */
    setDelault(defaultMode) {
        if (typeof defaultMode?.outboundMode === "string") {
            defaultMode.outboundMode = OutboundMode[defaultMode.outboundMode]
        }
        this.default = defaultMode

        return this
    }

    _getMode() {
        return this.modeList[this.ssid] ?? this.default
    }

    /**
     * 切换运行模式
     * @param {Function} callback
     */
    changeMode(callback) {
        const config = this._getMode()
        let body = ""
        if (config.outboundMode instanceof OutboundMode) {
            body += `Outbound Mode -> ${config.outboundMode.toString()}\n`
            config.outboundMode.set()
        }
        if (config.selectPolicy !== undefined) {
            body += `Policy Changed:\n `
            for (let group of Object.keys(config.selectPolicy)) {
                Utils.setSelectGroupPolicy(group, config.selectPolicy[group])
                body += `${group} -> ${config.selectPolicy[group]}\n`
            }
        }
        Logger.log(`SSID: ${this.ssid}`)
        Logger.log(body)
        if (this._isNotification()) {
            Utils.notification("Network Changed", `SSID: ${this.ssid}`, body)
        }
        if (typeof callback === "function") callback()
    }
}

// "outboundMode:policyGroup=policy,policyGroup2=policy2"
function parseStringConfig(configStr) {
    const config = {}
    let items = configStr.trim().split(":")
    config.outboundMode = items[0]
    config.selectPolicy = {}
    for (let item of items[1].trim().split(",")) {
        let [group, policy] = item.trim().split("=")
        config.selectPolicy[group] = policy
    }
    return config
}

// "ssid1:outboundMode:policyGroup=policy,policyGroup2=policy2;ssid2:outboundMode:policyGroup=policy,policyGroup2=policy2"
function parseSSIDConfig(configStr) {
    const config = {}
    const items = configStr.trim().split(";")
    for (let item of items) {
        const ssid = item.split(":")[0].trim()
        const cfgStr = item.slice(ssid.length + 1).trim()
        config[ssid] = parseStringConfig(cfgStr)
    }
    return config
}

const Args = {}
if (typeof $argument == "string" && $argument) {
    const args = $argument.split("&")
    for (let arg of args) {
        const key = arg.split("=")[0]
        const value = arg.slice(key.length + 1).slice(1, -1)
        if (key === "override" && value === "true") {
            Args.override = true
            continue
        }
        switch (key) {
            case "config":
                Args[key] = parseStringConfig(value)
                break
            case "ssidConfig":
                Args[key] = parseSSIDConfig(value)
                break
            case "notification":
                Args[key] = value
                break
        }
    }
}

const Config = {}
if (Args.override) {
    Config.notification = Args.notification
    Config.default = Args.default
    Config.ssidConfig = Args.ssidConfig
} else {
    const storage = new Storage()
    storage.setKeyPrefix("ipuppet.boxjs.ssid.")
    Config.notification = storage.get("notificationMode", Config.notification)
    Config.default = storage.get("defaultMode", Config.default, true)
    Config.ssidConfig = storage.get("modeList", Config.ssidConfig, true)
}

const ssid = new SSID()
ssid.setNotification(NotificationMode[Config.notification])
    .setDelault(Config.default)
    .setSSIDConfig(Config.ssidConfig)
    .changeMode(() => $done())
