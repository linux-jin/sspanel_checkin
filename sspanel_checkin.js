/**
 * @author Telegram@sudojia
 * @site https://blog.imzjw.cn
 * @date 2021/9/25 22:11
 * @last Modified by sudojia
 * @last Modified time 2022/01/20 11:17
 * @description SSPANEL面板自动签到
 */
const $ = require('./env').Env('SSPANEL面板自动签到');
const notify = $.isNode() ? require('./sendNotify') : '';
let message = '';
const axios = require('axios').default;
const accountList = process.env.SITE_ACCOUNTS ? process.env.SITE_ACCOUNTS.split('&') : [];

!(async () => {
    if (!accountList) {
        console.log('请先设置环境变量【SITE_ACCOUNTS】');
        process.exit(1);
    }
    // 校验格式 网站1,邮箱1:密码1&网站2,邮箱2:密码2
    const isValidFormat = accountList.every(account => {
        const parts = account.split(',');
        if (parts.length !== 2) {
            return false;
        }
        const [site, credentials] = parts;
        const credParts = credentials.split(':');
        return !(credParts.length !== 2 || !site || !credentials);
    });
    if (!isValidFormat) {
        console.error('格式错误，请确保遵循格式：网站1,邮箱1:密码1&网站2,邮箱2:密码2');
        process.exit(1);
    }
    for (let i = 0; i < accountList.length; i++) {
        const index = i + 1;
        const [rawUrl, emailPwd] = accountList[i].split(',');
        const [email, pwd] = emailPwd.split(':');
        console.log(`\n*****开始第【${index}】个网站****\n`);
        message += `第【${index}】个机场网站\n`;
        const url = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
        await login(url, email, pwd);
        if (1 === $.isRet) {
            console.log('开始签到白嫖流量...\n')
            await $.wait(1000);
            await checkin(url);
        }
        await $.wait(2000);
    }
    if (message) {
        await notify.sendNotify(`${$.name}`, `${message}`);
    }
})();

/**
 * 登录
 *
 * @returns {*}
 */
async function login(url, email, pwd) {
    const data = await sendRequest(`${url}/auth/login`, 'post', `email=${email}&passwd=${pwd}&code=`);
    // { ret: 1, msg: '登录成功' }
    $.isRet = data.ret;
}

/**
 * 签到
 *
 * @returns {*}
 */
async function checkin(url) {
    const data = await sendRequest(`${url}/user/checkin`, 'post', {});
    if (1 === data.ret) {
        console.log(`【签到信息】签到成功！获得${data.traffic}\n`)
        console.log(`【今日已用】${data.trafficInfo.todayUsedTraffic}`)
        console.log(`【过去已用】${data.trafficInfo.lastUsedTraffic}`)
        console.log(`【剩余流量】${data.trafficInfo.unUsedTraffic}`)
        message += `【签到信息】签到成功！获得${data.traffic}\n`
        message += `【今日已用】${data.trafficInfo.todayUsedTraffic}\n`
        message += `【过去已用】${data.trafficInfo.lastUsedTraffic}\n`
        message += `【剩余流量】${data.trafficInfo.unUsedTraffic}\n\n`;
    } else {
        console.log('签到异常', data.msg);
    }
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
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
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