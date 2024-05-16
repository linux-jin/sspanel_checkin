/**
 * @author Telegram@sudojia
 * @site https://blog.imzjw.cn
 * @date 2022/01/19 21:26
 * @last Modified by Telegram@sudojia
 * @last Modified time 2022/01/21 20:37
 * @description 掘金自动签到
 */
const $ = new require('./env').Env('掘金自动签到');
const notify = $.isNode() ? require('./sendNotify') : '';
let JUEJIN_COOKIE = process.env.JUEJIN_COOKIE, cookie = '', cookiesArr = [], message = '';

// ENABLE_TEN_DRAW: 是否开启十连抽, 默认不开启十连抽, true: 开启十连抽
// TEN_DRAW_NUM: 十连抽次数, 默认一次十连抽
let enableTenDraw = false, tenDrawNum = 1;

// TODO 目前十连抽默认所有账号都十连抽、未实现控制哪个账号执行十连抽, 我想到的思路比较烂, 如果你有更好的思路, 欢迎 Telegram@sudojia 或者 PR
if (process.env.ENABLE_TEN_DRAW) {
    enableTenDraw = process.env.ENABLE_TEN_DRAW
}
if (process.env.TEN_DRAW_NUM) {
    tenDrawNum = process.env.TEN_DRAW_NUM;
}

const JUEJIN_API = 'https://api.juejin.cn';

if (JUEJIN_COOKIE.indexOf('&') > -1) {
    cookiesArr = JUEJIN_COOKIE.split('&');
} else {
    cookiesArr = [JUEJIN_COOKIE];
}

!(async () => {
    if (!JUEJIN_COOKIE) {
        console.log('请设置环境变量【JUEJIN_COOKIE】')
        return;
    }
    if (!enableTenDraw) {
        console.log(`如需执行十连抽请设置环境变量【ENABLE_TEN_DRAW】为 true 和【TEN_DRAW_NUM】十连抽次数\n`);
    }
    for (let i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i];
            $.index = i + 1;
            $.isLogin = true;
            // 免费抽奖次数
            $.freeCount = 0;
            // 账号总矿石数
            $.oreNum = 0;
            console.log(`\n*****开始第【${$.index}】个账号****\n`);
            await checkStatus();
            message += `📣==========掘金账号${$.index}==========📣\n`;
            if (!$.isLogin) {
                await notify.sendNotify(`「掘金签到报告」`, `掘金账号${$.index} Cookie 已失效，请重新登录获取 Cookie`);
            }
            await main();
            await $.wait(2000);
        }
    }
    if (message) {
        await notify.sendNotify(`「掘金签到报告」`, `${message}`);
    }
})().catch((e) => {
    console.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
}).finally(() => {
    $.done();
});

async function main() {
    await getUserName();
    await checkIn();
    await getCount();
    await queryFreeLuckyDrawCount();
    if ($.freeCount === 0) {
        message += `【抽奖信息】白嫖次数已用尽~\n`
    } else {
        await luckyDraw();
    }
    await getOreNum();
    message += `=============【十连抽详情】=============\n`
    if (!enableTenDraw) {
        message += `未设置十连抽变量 ENABLE_TEN_DRAW, 取消十连抽\n`;
    } else {
        console.log(`检测到你已开启十连抽，正在为你执行十连抽...`);
        for (let i = 0; i < tenDrawNum; i++) {
            await tenDraw();
            if (i < tenDrawNum - 1) {
                await $.wait(2000);
            }
        }
    }
}

/**
 * 签到函数
 *
 * @returns {*}
 */
function checkIn() {
    return new Promise((resolve) => {
        $.post(sendPost('growth_api/v1/check_in', ``), (err, response, data) => {
            try {
                if (err) {
                    console.log(`checkIn API 请求失败\n${JSON.stringify(err)}`)
                } else {
                    data = JSON.parse(data);
                    // 签到所获取的矿石数
                    let incrPoint = data.data.incr_point;
                    // 当前账号总矿石数
                    let sumPoint = data.data.sum_point;
                    if (15001 === data.err_no) {
                        message += `【签到详情】今天已经签到过了!\n【总矿石数】${sumPoint}矿石\n`;
                    }
                    message += `【签到详情】今日签到获得${incrPoint}矿石数\n【总矿石数】${sumPoint}矿石\n`;
                }
            } catch (err) {
                console.log(err, response);
            } finally {
                resolve();
            }
        })
    })
}

/**
 * 获取昵称
 */
function getUserName() {
    return new Promise((resolve) => {
        $.get(sendGet('user_api/v1/user/get', ``), (err, response, data) => {
            try {
                if (err) {
                    console.log(`getUserName API 请求失败\n${JSON.stringify(err)}`)
                } else {
                    data = JSON.parse(data);
                    // 用户昵称
                    let userName = data.data.user_name;
                    // 获取等级
                    let jscoreLevel = data.data.user_growth_info.jscore_level;
                    // 获取等级称号
                    let jscoreTitle = data.data.user_growth_info.jscore_title;
                    // 下一等级的分数
                    let jscoreNextLevelScore = data.data.user_growth_info.jscore_next_level_score;
                    // 掘友分
                    let jscore = data.data.user_growth_info.jscore;
                    if (jscoreLevel === 8) {
                        message += `【账号昵称】${userName}\n【等级详情】满级大佬\n`;
                    }
                    message += `【账号昵称】${userName}\n【等级详情】${jscoreTitle}(${jscoreLevel}级)、掘友分: ${jscore}、还需${jscoreNextLevelScore - jscore}分可升至掘友${jscoreLevel + 1}级\n`;
                }
            } catch (err) {
                // console.log(err, response);
            } finally {
                resolve();
            }
        })
    })
}

/**
 * 获取总账号矿石数
 */
function getOreNum() {
    return new Promise((resolve) => {
        $.get(sendGet('growth_api/v1/get_cur_point', ``), (err, response, data) => {
            try {
                if (err) {
                    console.log(`getOreNum API 请求失败\n${JSON.stringify(err)}`)
                } else {
                    data = JSON.parse(data);
                    // 当前账号总矿石数
                    $.oreNum = data.data;
                }
            } catch (err) {
                console.log(err, response);
            } finally {
                resolve();
            }
        })
    })
}


/**
 * 查询免费抽奖次数
 */
function queryFreeLuckyDrawCount() {
    return new Promise((resolve) => {
        $.get(sendGet('growth_api/v1/lottery_config/get', ``), (err, response, data) => {
            try {
                if (err) {
                    console.log(`queryFreeLuckyDrawCount API 请求失败\n${JSON.stringify(err)}`)
                } else {
                    data = JSON.parse(data);
                    // 获取免费抽奖次数
                    $.freeCount = data.data.free_count;
                }
            } catch (err) {
                console.log(err, response);
            } finally {
                resolve();
            }
        })
    })
}


/**
 * 统计签到天数, 没什么用~
 */
function getCount() {
    return new Promise((resolve) => {
        $.get(sendGet('growth_api/v1/get_counts', ``), (err, response, data) => {
            try {
                if (err) {
                    console.log(`getCount API 请求失败\n${JSON.stringify(err)}`)
                } else {
                    data = JSON.parse(data);
                    message += `【签到统计】连续签到${data.data.cont_count}天、累计签到${data.data.sum_count}天\n`
                }
            } catch (err) {
                console.log(err, response);
            } finally {
                resolve();
            }
        })
    })
}

/**
 * 抽奖函数
 * 目前已知奖品
 * lottery_id: 6981716980386496552、name: 66矿石、type: 1
 * lottery_id: 6981716405976743943、name: Bug、type: 2
 * lottery_id: 7020245697131708419、name: 掘金帆布袋、type: 4
 * lottery_id: 7017679355841085472、name: 随机限量徽章、type: 4
 * lottery_id: 6997270183769276416、name: Yoyo抱枕、type: 4
 * lottery_id: 7001028932350771203、name: 掘金马克杯、type: 4
 * lottery_id: 7020306802570952718、name: 掘金棒球帽、type: 4
 * lottery_id: 6981705951946489886、name: Switch、type: 3
 */
function luckyDraw() {
    return new Promise((resolve) => {
        $.post(sendPost('growth_api/v1/lottery/draw', ``), (err, response, data) => {
            try {
                if (err) {
                    console.log(`luckyDraw API 请求失败\n${JSON.stringify(err)}`)
                } else {
                    data = JSON.parse(data);
                    message += `【抽奖信息】抽中了${data.data.lottery_name}\n`;
                }
            } catch (err) {
                console.log(err, response);
            } finally {
                resolve();
            }
        })
    })
}

/**
 * 十连抽
 */
function tenDraw() {
    return new Promise((resolve) => {
        $.post(sendPost('growth_api/v1/lottery/ten_draw', ``), (err, response, data) => {
            try {
                if (err) {
                    console.log(`tenDraw API 请求失败\n${JSON.stringify(err)}`)
                } else {
                    if (2000 > $.oreNum) {
                        message += `账号总矿石数不足 2000，取消十连抽！\n`
                        console.log(`账号总矿石数不足 2000，取消十连抽！`)
                        return;
                    }
                    // 单抽加 10 幸运值、十连抽加 100 幸运值，6000 满格
                    console.log(`本次十连抽共消耗 2000 矿石数\n十连抽奖励为: `)
                    data = JSON.parse(data);
                    $.lotteryBases = data.data.LotteryBases;
                    for (let draw of $.lotteryBases) {
                        message += `抽中了${draw.lottery_name}\n`
                        console.log(`抽中了${draw.lottery_name}`)
                    }
                    let needOreNum = (6000 - data.data.total_lucky_value) / 100 * 2000;
                    message += `本次十连抽加${data.data.draw_lucky_value}幸运值，当前幸运值为${data.data.total_lucky_value}，离满格还差${6000 - data.data.total_lucky_value}幸运值，所需${needOreNum}矿石数，还需十连抽${(6000 - data.data.total_lucky_value) / 100}次\n\n`;
                    console.log(`本次十连抽加${data.data.draw_lucky_value}幸运值`);
                    console.log(`当前幸运值为${data.data.total_lucky_value}`);
                    console.log(`离幸运值满格还差${6000 - data.data.total_lucky_value}幸运值，所需${needOreNum}矿石数，还需十连抽${(6000 - data.data.total_lucky_value) / 100}次`);
                }
            } catch (err) {
                console.log(err, response);
            } finally {
                resolve();
            }
        })
    })
}

/**
 * 检测状态
 */
function checkStatus() {
    return new Promise((resolve) => {
        $.get(sendGet('growth_api/v1/get_today_status', ''), (err, response, data) => {
            try {
                if (err) {
                    console.log(`checkStatus API 请求失败\n${JSON.stringify(err)}`)
                } else {
                    data = JSON.parse(data);
                    if (403 === data.err_no) {
                        // Cookie 已失效
                        $.isLogin = false;
                    }
                    console.log(data);
                }
            } catch (err) {
                console.log(err, response);
            } finally {
                resolve();
            }
        })
    })
}

function sendGet(path, body) {
    return {
        url: `${JUEJIN_API}/${path}?body=${body}`,
        headers: {
            "Accept": "*/*",
            "Content-type": "application/json",
            "Referer": `${JUEJIN_API}`,
            "Cookie": `${cookie}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36"
        }
    }
}

function sendPost(path, body = {}) {
    return {
        url: `${JUEJIN_API}/${path}`,
        body: body,
        headers: {
            "Accept": "*/*",
            "Content-type": "application/json",
            "Referer": `${JUEJIN_API}`,
            "Cookie": `${cookie}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36"
        }
    }
}
