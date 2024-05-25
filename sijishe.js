/**
 * @author Telegram@sudojia
 * @site https://blog.imzjw.cn
 * @date 2024/05/20
 * @description 司机社自动签到
 */
const $ = require('./env').Env('司机社自动签到');
const notify = $.isNode() ? require('./sendNotify') : '';
const randomWait = require('./utils/getRandomWait');
const axios = require('axios').default;
const cheerio = require('cheerio');
if (!process.env.SJS_COOKIE) {
    console.error('请填写司机社环境变量【SJS_COOKIE】!');
    process.exit(1);
}
const siJiSheList = process.env.SJS_COOKIE.split('&').map(urlWithCookie => {
    const [url, cookie] = urlWithCookie.split('@');
    return {url, cookie};
});
let message = '';
let index = 0;

!(async () => {
    for (let {url, cookie} of siJiSheList) {
        index++;
        console.log(`\n*****开始第【${index}】个司机社账号****\n`);
        message += `📣==========司机社账号【${index}】==========📣\n`;
        if (url.endsWith('/')) {
            url = url.slice(0, -1);
        }
        url = url.replace(/\/$/, '');
        await main(url, cookie);
        await $.wait(randomWait(2000, 2500))
    }
    if (message) {
        await notify.sendNotify(`${$.name}`, `${message}`);
    }
})();

async function main(url, cookie) {
    await checkIn(url, cookie)
    await $.wait(randomWait(1200, 1700));
    await getCheckInInfo(url, cookie)
    await $.wait(randomWait(1100, 1600));
    await getUserInfo(url, cookie)
}

/**
 * 签到接口
 *
 * @param url
 * @param cookie
 * @returns {Promise<void>}
 */
async function checkIn(url, cookie) {
    const data = await sendRequest(`${url}/k_misign-sign.html`, 'get', cookie, {});
    const $ = cheerio.load(data);
    const loginLink = $('a:contains("登录")');
    if (loginLink.length) {
        const loginText = loginLink.text();
        if ('登录' === loginText) {
            console.log(`司机社账号【${index}】Cookie 可能已失效，请重新登录获取！`)
            await notify.sendNotify(`${$.name}`, `司机社账号【${index}】Cookie 可能已失效，请重新登录获取！`);
            process.exit(1);
        }
    }
    const qiandaoUrl = $('#JD_sign').attr('href');
    if (undefined === qiandaoUrl) {
        message += `【签到信息】今天已经签到过了\n`
        console.log(`【签到信息】今天已经签到过了`)
    } else {
        await sendRequest(`${url}/${qiandaoUrl}`, 'get', cookie, {})
        message += `【签到信息】签到成功\n`
        console.log(`【签到信息】签到成功`)
    }
}

/**
 * 獲取用戶信息
 *
 * @param url
 * @param cookie
 * @returns {Promise<void>}
 */
async function getUserInfo(url, cookie) {
    const data = await sendRequest(`${url}/home.php?mod=space`, 'get', cookie, {})
    const $ = cheerio.load(data);
    // 账户名称
    const userName = $('#ct > div > div:nth-child(2) > div > div:nth-child(1) > div:nth-child(1) > h2:nth-child(1)').text().trim().replace(/\r?\n/g, "");
    // 当前车票数
    const ticket = $('#psts > ul > li:nth-child(4)').text().trim();
    // 当前积分
    const points = $('#psts > ul > li:nth-child(2)').text().trim();
    // 当前威望
    const prestige = $('#psts > ul > li:nth-child(3)').text().trim();
    // 当前贡献
    const contribute = $('#psts > ul > li:nth-child(5)').text().trim();
    message += `【统计信息】\n${userName}、${ticket}、${points}、${prestige}、${contribute}\n`
}

/**
 * 獲取簽到信息
 *
 * @param url
 * @param cookie
 * @returns {Promise<void>}
 */
async function getCheckInInfo(url, cookie) {
    const data = await sendRequest(`${url}/k_misign-sign.html`, 'get', cookie, {});
    const $ = cheerio.load(data);
    // 签到排名
    const ranking = $('#qiandaobtnnum').attr('value');
    // 连续签到
    const lxDays = $('#lxdays').attr('value');
    // 签到等级
    const lxLevel = $('#lxlevel').attr('value');
    // 积分奖励
    const lxReward = $('#lxreward').attr('value');
    // 总天数
    const lxtDays = $('#lxtdays').attr('value');
    message += `【签到排名】${ranking}\n【连续签到】${lxDays}\n【签到等级】Lv.${lxLevel}\n【积分奖励】${lxReward}\n【总天数】${lxtDays} 天\n`

}

/**
 * 发送请求
 *
 * @param url 请求地址
 * @param method 请求方法
 * @param cookie
 * @param data 请求参数
 *
 * @returns {Promise<any>} 请求结果
 */
async function sendRequest(url, method, cookie, data = {}) {
    const options = {
        method,
        url,
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36 Edg/103.0.1264.77',
            cookie: cookie
        },
        data
    };
    try {
        const response = await axios(options);
        return response.data;
    } catch (error) {
        console.error(`请求失败: ${error.response}`);
        throw error;
    }
}