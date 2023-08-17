let body = $response.body

body = body.replaceAll("$.log", "__mute")
body = body.replaceAll("$.msg", "__mute")
body = "const __mute=()=>{};\n" + body

$done({body})
