/**
 * 根据SSID自动更改策略组和Loon运行模式。
 * 
 * Author: ipuppet
 * GitHub: https://github.com/ipuppet/Profiles/blob/master/Loon/Script/ssid.js
 */

class DataCenter {
    constructor() {
        this.keyPrefix = ""
        this.empty = [
            undefined,
            null,
            ""
        ]
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
    getData(key, _default = null, jsonDecode = false) {
        let value = $persistentStore.read(this.keyPrefix + key)
        if (jsonDecode) value = JSON.parse(value)
        return this.isEmpty(value) ? _default : value
    }

    /**
     * 写入数据
     * @param {*} value 
     * @param {String} key 
     */
    setData(value, key) {
        if (typeof value === "object") {
            value = JSON.stringify(value)
        }
        $persistentStore.write(value, key)
    }
}

/* config
{
    "all_buildin_nodes" =     (
        DIRECT,
        REJECT
    );
    "all_policy_groups" =     (
        GlobalMedia,
        Telegram,
        Netflix,
        Proxy
    );
    final = Proxy;
    "global_proxy" = Proxy;
    "policy_select" =     {
        GlobalMedia = Proxy;
        Netflix = Proxy;
        Proxy = "xxx";
        Telegram = "xxx2";
    };
    "running_model" = 1;
    ssid = "";
} */
class Utils {
    static RunningModel = {
        GlobalDirect: 0,
        ByRule: 1,
        GlobalProxy: 2
    }
    static config = JSON.parse($config.getConfig())

    /**
     * 将 runningModel 转换为文本用于展示
     * @param {Number} runningModel Utils.RunningModel
     * @returns 
     */
    static runningModelToName(runningModel) {
        const _runningModelToName = {
            [Utils.RunningModel.GlobalDirect]: "全局直连",
            [Utils.RunningModel.ByRule]: "自动分流",
            [Utils.RunningModel.GlobalProxy]: "全局代理"
        }
        return _runningModelToName[runningModel] ?? "Undefined"
    }

    /**
     * 切换运行模式
     * @param {Number} runningModel Utils.RunningModel
     */
    static setRunningModel(runningModel) {
        $config.setRunningModel(runningModel)
    }

    /**
     * 切换策略组策略
     * @param {String} policyGroup 策略组名称
     * @param {String} policy 待选策略
     */
    static setSelectPolicy(policyGroup, policy) {
        $config.setSelectPolicy(policyGroup, policy)
    }

    /**
     * 获取相关策略的子策略
     * @param {String} policyGroup 
     */
    static getSubPolicys(policyGroup) {
        return JSON.parse($config.getSubPolicys(policyGroup))
    }

    static notification(title, head, message) {
        $notification.post(title, head, message)
    }

    static _httpRequestCallback(resolve, reject, error, response, data) {
        if (error) {
            reject(error)
        } else {
            resolve(response, data)
        }
    }

    static get(option = {}) {
        return new Promise((resolve, reject) => {
            $httpClient.get(option, (error, response, data) => {
                Utils._httpRequestCallback(resolve, reject, error, response, data)
            })
        })
    }

    static post(option = {}) {
        return new Promise((resolve, reject) => {
            $httpClient.post(option, (error, response, data) => {
                Utils._httpRequestCallback(resolve, reject, error, response, data)
            })
        })
    }
}

const NotificationMode = {
    None: 0, // 关闭通知
    All: 1, // 所有通知
    Matched: 2, // 匹配到配置
    NotMatched: 3 // 未匹配到配置
}

class ModelRegulator {
    constructor() {
        this.defaultModel = { runningModel: Utils.RunningModel.ByRule }
    }

    /**
     * 配置某网络下的运行模式
     * @param {Object} modelList 格式如下：
     * "ssid名称": {
     *     runningModel: Utils.RunningModel.GlobalDirect, // 运行模式
     *     selectPolicy: { // 设置策略组
     *         "Proxy": "DIRECT", // 节点或其他策略明称，如：'日本 1.5x'、'自动测试'
     *         "Google": "Proxy", // 将名称为 Google 的策略改为 Proxy
     *         "Telegram": "Proxy", // 将名称为 Telegram 的策略改为 Proxy
     *     }
     * }
     * @returns this
     */
    setModelList(modelList) {
        Object.keys(modelList).forEach(ssid => {
            if (typeof modelList[ssid].runningModel === "string")
                modelList[ssid].runningModel = Utils.RunningModel[modelList[ssid].runningModel]
        })
        this.modelList = modelList
        return this
    }

    /**
     * 所有未配置的网络更改均走此配置
     * @param {Object} defaultModel 
     * @returns this
     */
    setDelaultModel(defaultModel) {
        if (typeof defaultModel?.runningModel === "string")
            defaultModel.runningModel = Utils.RunningModel[defaultModel.runningModel]
        this.defaultModel = defaultModel
        return this
    }

    /**
     * 配置通知
     * @param {Number} notification NotificationMode
     * @returns this
     */
    setNotificationMode(notificationMode) {
        this.notificationMode = notificationMode
        return this
    }

    _isNotification() {
        if (this.notificationMode === NotificationMode.All) return true
        if (this.notificationMode === NotificationMode.None) return false
        const model = this._getModel()
        if (model === this.defaultModel) {
            if (this.notificationMode === NotificationMode.NotMatched) return true
        } else if (this.notificationMode === NotificationMode.Matched) {
            return true
        }
        return false
    }

    _getModel() {
        return this.modelList[Utils.config.ssid] ?? this.defaultModel
    }

    /**
     * 切换运行模式
     * @param {Function} callback 
     */
    changeModel(callback) {
        const config = Object.assign(this._getModel(), { ssid: Utils.config.ssid })
        let message = ""
        if (undefined !== config.runningModel) {
            message += `运行模式 -> ${Utils.runningModelToName(config.runningModel)}\n`
            Utils.setRunningModel(config.runningModel)
        }
        if (undefined !== config.selectPolicy) {
            message += `策略组变更:\n `
            for (let policy of Object.keys(config.selectPolicy)) {
                Utils.setSelectPolicy(policy, config.selectPolicy[policy])
                message += `${policy} -> ${config.selectPolicy[policy]}\n`
            }
        }
        if (this._isNotification()) {
            $notification.post("网络变化", `网络已切换到：${config.ssid}`, message)
        }
        if (typeof callback === "function") callback()
    }
}

const dc = new DataCenter()
dc.setKeyPrefix("ipuppet.boxjs.ssid.")

const userStorage = {
    notificationMode: dc.getData("notificationMode", "All"),
    defaultModel: dc.getData("defaultModel", { runningModel: Utils.RunningModel.ByRule }, true),
    modelList: dc.getData("modelList", {}, true)
}

const modelRegulator = new ModelRegulator()
modelRegulator
    .setNotificationMode(NotificationMode[userStorage.notificationMode])
    .setDelaultModel(userStorage.defaultModel)
    .setModelList(userStorage.modelList)
    .changeModel(() => { $done() })
