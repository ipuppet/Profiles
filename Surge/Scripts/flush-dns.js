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

!(async () => {
    const argument = typeof $argument !== "undefined" ? Object.fromEntries($argument.split("&").map(item => item.split("="))) : {}
    const panel = {
        title: argument.title ?? "Flush DNS",
        icon: argument.icon ?? "arrow.clockwise",
        "icon-color": argument.color ?? "#3d3d5b"
    }

    if ($trigger === "button") {
        await SurgeAPI.post("/v1/dns/flush")
    }

    let delay = ((await SurgeAPI.post("/v1/test/dns_delay")).delay * 1000).toFixed(0)
    panel.content = `Delay: ${delay}ms`

    if (argument.server !== "false") {
        let dnsServer = $network.dns?.join("\n")
        panel.content += `\nDNS Server:\n${dnsServer}`
    }

    $done(panel)
})()
