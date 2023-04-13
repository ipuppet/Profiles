/**
 * https://github.com/rartv/SurgeScript/blob/main/EmbyPremiere/EmbyPremiere.js
 */

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

if ($request.url.indexOf("mb3admin.com/admin/service/registration/validateDevice") !== -1) {
    if ($response.status !== 200) {
        const argument = Argument.all()
        if (argument.notification ?? true) {
            $notification.post("Emby Premiere 已激活", "", "")
        }
        if (argument.console ?? true) {
            console.log("Emby Premiere 已激活")
        }
        $done({
            status: 200,
            headers: $response.headers,
            body: '{"cacheExpirationDays":999,"resultCode":"GOOD","message":"Device Valid"}'
        })
    } else {
        $done({})
    }
} else {
    $done({})
}
