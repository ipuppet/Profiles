// https?://raw\.githubusercontent\.com((?!ipuppet).)*.*\.js$

let body = $response.body

body = body.replaceAll("this.log", "__mute")
body = body.replaceAll("$.log", "__mute")
body = body.replaceAll("this.msg", "__mute")
body = body.replaceAll("$.msg", "__mute")
body = "const __mute=()=>{};\n" + body

$done({body})
