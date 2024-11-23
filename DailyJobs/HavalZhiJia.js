/*********************************
哈弗智家签到脚本

脚本原作者: @reinject
平台兼容: QuantumultX, Surge, Loon
更新日期: 2024/11/23

获取Cookie说明：
打开哈弗智家App后, 如通知成功获取cookie则可以使用该脚本.

*********************************
Surge(iOS 5.9.0+/macOS 5.5.0+)模块：
https://raw.githubusercontent.com/0xlane/qx_scripts/main/DailyJobs/Surge/Module/HavalZhiJIaDailyJob.sgmodule

*********************************
QuantumultX 任务仓库(Gallery)订阅：
https://raw.githubusercontent.com/0xlane/qx_scripts/main/DailyJobs/DailyJobs.json

工具&分析->HTTP请求->右上角添加任务仓库->选择哈弗智家签到脚本添加定时任务和附加组件

*********************************
Loon 脚本订阅(非插件)：
https://raw.githubusercontent.com/0xlane/qx_scripts/main/DailyJobs/Loon/HavalZhiJiaDailyJob.plugin

添加后请按需启用脚本

*********************************/


var $core = core();
var accessTokenVal = $core.read("AccessTokenHAVAL");

var url_fetch_sign = {
    url: "https://gw-h5-gateway.gwmapp-h.com/app-api/api/v1.0/signIn/sign",
    headers: {
        accessToken: accessTokenVal,
        terminal: "GW_APP_Haval",
        enterpriseId: "CC01",
        rs: 2,
        brand: 1,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 fromappios haval"
    }
};
var url_fetch_sign_status = {
    url: "https://gw-h5-gateway.gwmapp-h.com/app-api/api/v1.0/pointInterflow/querySumPoint",
    headers: {
        accessToken: accessTokenVal,
        terminal: "GW_APP_Haval",
        enterpriseId: "CC01",
        rs: 2,
        brand: 1,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 fromappios haval"
    }
}

if ($core.isRequest) {
    GetAccessToken()
} else {
    signHaval()
}

function signHaval() {
    if (!accessTokenVal) {
        $core.notify("哈弗智家签到", "签到失败", "未获取到token");
        return $core.done()
    }
    $core.get(url_fetch_sign, function (error, response, data) {
        if (error) {
            console.log(JSON.stringify(error));
            $core.notify("哈弗智家签到", "签到失败", JSON.stringify(error));
            $core.done()
        } else {
            // $core.notify("哈弗智家签到", "签到结果", response.body);
            var body = JSON.parse(data);
            var isSuccessResponse = body && (body.code == "000000" || body.code == "651028");
            if (!isSuccessResponse) {
                $core.notify("哈弗智家签到", "签到失败", (body && body.description) ? body.description : "接口数据获取失败");
                return $core.done()
            }

            $core.get(url_fetch_sign_status, function (error, response, data) {
                if (error) {
                    console.log(JSON.stringify(error));
                    $core.notify("哈弗智家签到", "签到成功", JSON.stringify(error));
                    $core.done()
                } else {
                    var body = JSON.parse(data);
                    var isSuccessResponse = body && body.code == "000000";
                    if (!isSuccessResponse) {
                        $core.notify("哈弗智家签到", "签到成功", (body && body.description) ? body.description : "积分接口数据获取失败");
                        return $core.done()
                    }

                    var totalPoint = (body && body.data.totalPoint) ? body.data.totalPoint : "unkown";

                    $core.notify("哈弗智家签到", "签到成功", `您当前共有${totalPoint}积分`);
                    return $core.done()
                }
            })
        }
    })
}

function GetAccessToken() {
    let headerAccessToken = $request.headers["accessToken"];
    if (headerAccessToken) {
        if (!accessTokenVal) {
            $core.notify("写入哈弗智家accessToken成功 🎉", "", "");
        } else {
            console.log(`写入哈弗智家accessToken成功 🎉`);
        }
        $core.write(headerAccessToken, "AccessTokenHAVAL")
    } else {
        console.log("写入accessToken失败");
    }
    return $core.done();
}

function core() {
    const isRequest = typeof $request != "undefined"
    const isSurge = typeof $httpClient != "undefined"
    const isQuanX = typeof $task != "undefined"
    const notify = (title, subtitle, message) => {
        if (isQuanX) $notify(title, subtitle, message)
        if (isSurge) $notification.post(title, subtitle, message)
    }
    const write = (value, key) => {
        if (isQuanX) return $prefs.setValueForKey(value, key)
        if (isSurge) return $persistentStore.write(value, key)
    }
    const read = (key) => {
        if (isQuanX) return $prefs.valueForKey(key)
        if (isSurge) return $persistentStore.read(key)
    }
    const adapterStatus = (response) => {
        if (response) {
            if (response.status) {
                response["statusCode"] = response.status
            } else if (response.statusCode) {
                response["status"] = response.statusCode
            }
        }
        return response
    }
    const get = (options, callback) => {
        if (isQuanX) {
            if (typeof options == "string") options = {
                url: options
            }
            options["method"] = "GET"
            $task.fetch(options).then(response => {
                callback(null, adapterStatus(response), response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) $httpClient.get(options, (error, response, body) => {
            callback(error, adapterStatus(response), body)
        })
    }
    const post = (options, callback) => {
        if (isQuanX) {
            if (typeof options == "string") options = {
                url: options
            }
            options["method"] = "POST"
            $task.fetch(options).then(response => {
                callback(null, adapterStatus(response), response.body)
            }, reason => callback(reason.error, null, null))
        }
        if (isSurge) {
            $httpClient.post(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
    }
    const done = (value = {}) => {
        if (isQuanX) return $done(value)
        if (isSurge) isRequest ? $done(value) : $done()
    }
    return {
        isRequest,
        notify,
        write,
        read,
        get,
        post,
        done
    }
};
