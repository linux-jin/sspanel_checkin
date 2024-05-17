/**
 * @author Telegram@sudojia
 * @site https://blog.imzjw.cn
 * @date 2022/01/19 21:26
 * @last Modified by Telegram@sudojia
 * @last Modified time 2022/01/21 20:37
 * @description 掘金自动签到
 */
const $ = require('./env').Env('掘金自动签到');
const notify = $.isNode() ? require('./sendNotify') : '';
const axios = require('axios').default;

// 定义配置
const config = {
    // 掘金 API
    JUEJIN_API: 'https://api.juejin.cn',
    // 是否十连抽
    ENABLE_TEN_DRAW: process.env.ENABLE_TEN_DRAW || false,
    // 十连抽次数
    TEN_DRAW_NUM: parseInt(process.env.TEN_DRAW_NUM) || 1,
};
let cookiesArr = (process.env.JUEJIN_COOKIE || '').split('&'), message = '';

if (!config.ENABLE_TEN_DRAW) {
    console.log(`\n如需执行十连抽请设置环境变量【ENABLE_TEN_DRAW】\n`);
}
if (!Array.isArray(cookiesArr) || cookiesArr.length === 0) {
    console.log('请设置环境变量【JUEJIN_COOKIE】\n');
    process.exit(1);
}

!(async () => {
    for (let i = 0; i < cookiesArr.length; i++) {
        $.cookie = cookiesArr[i];
        $.index = i + 1;
        $.isLogin = true;
        $.freeCount = 0;
        $.oreNum = 0;
        console.log(`\n*****开始第【${$.index}】个账号****\n`);
        message += `📣==========掘金账号${$.index}==========📣\n`;
        try {
            await checkStatus();
            if (!$.isLogin) {
                await notify.sendNotify(`「掘金签到报告」`, `掘金账号${$.index} Cookie 已失效，请重新登录获取 Cookie`);
                continue;
            }
            await main();
        } catch (e) {
            console.error(`账号${$.index}发生异常: ${e}`);
        } finally {
            // 确保API调用不会过于频繁
            await $.wait(2000);
        }
    }
    if (message) {
        await notify.sendNotify(`「掘金签到报告」`, `${message}`);
    }
})();

/**
 * 主函数
 *
 * @returns {Promise<void>}
 */
async function main() {
    await getUserName();
    await checkIn();
    await getCount();
    await queryFreeLuckyDrawCount();
    if ($.freeCount === 0) {
        console.log(`白嫖次数已用尽~暂不抽奖\n`)
        message += `【抽奖信息】白嫖次数已用尽~\n`
    } else {
        await luckyDraw();
    }
    await getOreNum();
    message += `【十连抽详情】\n`
    if (!config.ENABLE_TEN_DRAW) {
        message += `未设置十连抽变量 ENABLE_TEN_DRAW, 取消十连抽\n\n`;
        return;
    }
    console.log(`检测到你已开启十连抽，正在为你执行十连抽...`);
    for (let i = 0; i < config.TEN_DRAW_NUM; i++) {
        await tenDraw();
        if (i < config.TEN_DRAW_NUM - 1) {
            await $.wait(2000);
        }
    }
}

/**
 * 检查状态
 *
 * @returns {Promise<void>}
 */
async function checkStatus() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/get_today_status', 'get', '');
    if (403 === data.err_no) {
        // Cookie 已失效
        $.isLogin = false;
    }
}

/**
 * 签到函数
 *
 * @returns {*}
 */
async function checkIn() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/check_in', 'post', '')
    if (15001 === data.err_no) {
        console.log('您今日已完成签到，请勿重复签到');
    }
}

/**
 * 获取昵称
 */
async function getUserName() {
    const data = await sendRequest(config.JUEJIN_API + '/user_api/v1/user/get', 'get', '')
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
        return;
    }
    message += `【账号昵称】${userName}\n【等级详情】${jscoreTitle}(${jscoreLevel}级), 掘友分: ${jscore}, 还需${jscoreNextLevelScore - jscore}分可升至掘友${jscoreLevel + 1}级\n`;
}

/**
 * 获取总账号矿石数
 */
async function getOreNum() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/get_cur_point', 'get', '');
    // 当前账号总矿石数
    $.oreNum = data.data;
}

/**
 * 查询免费抽奖次数
 */
async function queryFreeLuckyDrawCount() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/lottery_config/get', 'get', '')
    // 获取免费抽奖次数
    $.freeCount = data.data.free_count;
}


/**
 * 统计签到天数, 没什么用~
 */
async function getCount() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/get_counts', 'get', '');
    message += `【签到统计】连续签到${data.data.cont_count}天、累计签到${data.data.sum_count}天\n`
}

/**
 * 抽奖函数
 * 目前已知奖品
 * lottery_id: 6981716980386496552、name: 矿石、type: 1
 * lottery_id: 6981716405976743943、name: Bug、type: 2
 * lottery_id: 7020245697131708419、name: 掘金帆布袋、type: 4
 * lottery_id: 7017679355841085472、name: 随机限量徽章、type: 4
 * lottery_id: 6997270183769276416、name: Yoyo抱枕、type: 4
 * lottery_id: 7001028932350771203、name: 掘金马克杯、type: 4
 * lottery_id: 7020306802570952718、name: 掘金棒球帽、type: 4
 * lottery_id: 6981705951946489886、name: Switch、type: 3
 */
async function luckyDraw() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/lottery/draw', 'post', '');
    message += `【抽奖信息】抽中了${data.data.lottery_name}\n`;
}

/**
 * 十连抽
 */
async function tenDraw() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/lottery/ten_draw', 'post', '');
    if (2000 > $.oreNum) {
        message += `账号总矿石数不足 2000，取消十连抽！\n\n`
        console.log(`账号总矿石数不足 2000，取消十连抽！`)
        return;
    }
    // 单抽加 10 幸运值、十连抽加 100 幸运值，6000 满格
    console.log(`本次十连抽共消耗 2000 矿石数\n十连抽奖励为: `)
    $.lotteryBases = data.data.LotteryBases;
    for (let draw of $.lotteryBases) {
        message += `抽中了${draw.lottery_name}\n`
        console.log(`抽中了${draw.lottery_name}`)
    }
    // 当前幸运值
    let totalLuckyValue = data.data.total_lucky_value;
    // 计算所需矿石数
    let needOreNum = (6000 - totalLuckyValue) / 100 * 2000;
    // 计算剩余幸运值
    let remainLuckyValue = 6000 - totalLuckyValue
    // 计算剩余十连抽次数
    let remainTenDrawCount = Math.round(remainLuckyValue / 100)
    message += `本次十连抽加${data.data.draw_lucky_value}幸运值，当前幸运值为${totalLuckyValue}，离满格还差${remainLuckyValue}幸运值，所需${needOreNum}矿石数，还需十连抽${remainTenDrawCount}次\n\n`;
    console.log(`本次十连抽加${data.data.draw_lucky_value}幸运值`);
    console.log(`当前幸运值为${totalLuckyValue}`);
    console.log(`离幸运值满格还差${remainLuckyValue}幸运值，所需${needOreNum}矿石数，还需十连抽${remainLuckyValue / 100}次`);
}

/**
 * 发送请求
 *
 * @param url 请求地址
 * @param method 请求方法
 * @param data 请求参数
 * @returns {Promise<any>} 请求结果
 */
async function sendRequest(url, method, data = {}) {
    const options = {
        method,
        url,
        headers: {
            "Accept": "*/*",
            "Content-type": "application/json",
            "Referer": `${config.JUEJIN_API}`,
            "Cookie": `sessionid=${$.cookie}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36"
        },
        data
    };
    try {
        const response = await axios(options);
        return response.data;
    } catch (error) {
        console.error(`请求失败: ${error}`);
        throw error;
    }
}