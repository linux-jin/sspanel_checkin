/**
 * @author Telegram@sudojia
 * @site https://blog.imzjw.cn
 * @date 2024/5/22 02:16
 * @description V2EX 签到
 */
const $ = require('./env').Env('V2EX每日签到');
const notify = $.isNode() ? require('./sendNotify') : '';
const randomWait = require('./utils/getRandomWait');
const cheerio = require('cheerio');
const axios = require('axios').default;
const v2exList = process.env.V2EX_COOKIE ? process.env.V2EX_COOKIE.split('&') : [];
let message = '';
!(async () => {
    if (!v2exList || v2exList.length === 0) {
        console.log('请先设置环境变量【V2EX_COOKIE】');
        process.exit(1);
    }
    for (let i = 0; i < v2exList.length; i++) {
        const index = i + 1;
        const cookie = v2exList[i];
        console.log(`\n*****开始第【${index}】个V2ex账号****\n`);
        message += `📣==========V2ex账号${index}==========📣\n`;
        await main(cookie);
        await $.wait(randomWait(2000, 3000));
    }
    if (message) {
        await notify.sendNotify(`${$.name}`, `${message}`);
    }
})();

async function main(cookie) {
    await getOnce(cookie)
    await wait();
    await getInfo(cookie)
}

/**
 * 获取once
 *
 * @param cookie
 * @returns {Promise<void>}
 */
async function getOnce(cookie) {
    const data = await sendRequest('https://www.v2ex.com/mission/daily', 'GET', cookie, {})
    const $ = cheerio.load(data);
    const targetLink = $('a.top').eq(1);
    const userName = targetLink.text();
    message += `【用户名称】${userName}\n`
    if (data.indexOf('每日登录奖励已领取') < 0) {
        console.log('开始签到...')
        const once = $('input[type="button"]')[0].attribs['onclick'].match(/once=(\d+)/)[1];
        await wait();
        await checkIn(once, cookie);
    } else {
        message += `【签到状态】已经签到过了\n`
        console.log('已经签到过了');
    }
}

/**
 * 签到
 *
 * @param once
 * @param cookie
 * @returns {Promise<void>}
 */
async function checkIn(once, cookie) {
    const data = await sendRequest(`https://www.v2ex.com/mission/daily/redeem?once=${once}`, 'GET', cookie, {})
    if (data.indexOf('每日登录奖励已领取') > -1) {
        console.log('签到成功');
        message += `【签到状态】签到成功！\n`
        const continueDays = data.match(/已连续登录 (\d+?) 天/)[1];
        message += `【签到统计】已连续签到${continueDays}天\n`
    } else {
        console.log('签到失败');
    }
}

async function getInfo(cookie) {
    const data = await sendRequest('https://www.v2ex.com/balance', 'GET', cookie, {})
    const $ = cheerio.load(data);
    const balanceArea = $('.balance_area');
    // 银币
    const silverAmount = parseInt(balanceArea.text().split(' ')[0], 10);
    // 铜币
    const bronzeAmount = parseInt(balanceArea.text().split(' ')[2], 10);
    // 由于本人没有金币，所以不知道怎么抓，就暂且写了银币和铜币
    message += `【账户余额】${silverAmount}银币 ${bronzeAmount}铜币\n`
}

async function wait() {
    await $.wait(randomWait(2000, 3000));
}

/**
 * 发送请求
 *
 * @param url 请求地址
 * @param method 请求方法
 * @param cookie
 * @param data 请求参数
 * @returns {Promise<any>} 请求结果
 */
async function sendRequest(url, method, cookie, data = {}) {
    const options = {
        method,
        url,
        headers: {
            'Accept-Encoding': `gzip, deflate, br`,
            'Connection': `keep-alive`,
            'Accept': `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`,
            'Cookie': cookie,
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