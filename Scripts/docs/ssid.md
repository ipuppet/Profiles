# SSID

脚本链接：
[https://raw.githubusercontent.com/ipuppet/Profiles/master/Scripts/ssid.js](https://raw.githubusercontent.com/ipuppet/Profiles/master/Scripts/ssid.js)

支持 Surge | Loon  
脚本应设置为 `network-changed` 类型

该脚本可根据 SSID 配置更改出站模式以及策略。  
可与软路由配合使用，当连接到软路由 WIFI 时自动切换至全局直连或将节点选为 DIRECT 且不影响广告过滤等。

## 配置项

- outboundMode  
    该项可省略  
    切换出站模式。可选值如下：
    - "GlobalDirect"
    - "ByRule"
    - "GlobalProxy"

- selectPolicy  
    该项可省略  
    切换策略组，该项应为键值对的形式存在。

## 配置示例：

- 网络切换配置  
    ```json
    {
        "ssid_1": {
            "outboundMode": "GlobalDirect",
            "selectPolicy": {
                "节点选择": "DIRECT",
                "Google": "节点选择"
            }
        },
        "ssid_2": {
            "outboundMode": "GlobalDirect",
            "selectPolicy": {
                "节点选择": "DIRECT",
                "Google": "节点选择"
            }
        }
    }
    ```
    其中 `"节点选择": "DIRECT"` 若要切换到 DIRECT 需要 "节点选择" 中存在 DIRECT 选项

- 未匹配网络 SSID 时的默认配置  
    ```json
    {
        "outboundMode": "GlobalDirect",
        "selectPolicy": {
            "节点选择": "节点名称或其他策略名称",
            "Google": "节点选择"
        }
    }
    ```

