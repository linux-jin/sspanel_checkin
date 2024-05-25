/**
 * @author Telegram@sudojia
 * @site https://blog.imzjw.cn
 * @date 2024/5/18 15:09
 * @description 阿里云盘自动签到
 */
const $ = require('./env').Env('阿里云盘自动签到');
const notify = $.isNode() ? require('./sendNotify') : '';
const randomWait = require('./utils/getRandomWait');
const axios = require('axios').default;
const refreshTokenList = process.env.ALI_REFRESH_TOKEN ? process.env.ALI_REFRESH_TOKEN.split('&') : [];
let message = '';

// 阿里云盘 API 配置
const API_CONFIG = {
    "SIGN_IN_API": "https://member.aliyundrive.com/v1/activity/sign_in_list",
    "GET_REWARD_API": "https://member.aliyundrive.com/v1/activity/sign_in_reward?_rx-s=mobile",
    "ACCESS_TOKEN_API": "https://auth.aliyundrive.com/v2/account/token"
}

!(async () => {
    if (!refreshTokenList || refreshTokenList.length === 0) {
        console.log('请先设置环境变量【ALI_REFRESH_TOKEN】');
        process.exit(1);
    }
    for (let i = 0; i < refreshTokenList.length; i++) {
        $.index = i + 1;
        const refreshToken = refreshTokenList[i];
        console.log(`\n*****开始第【${$.index}】个阿里账号****\n`);
        message += `📣==========阿里账号${$.index}==========📣\n`;
        await main(refreshToken);
        await $.wait(randomWait(2300, 2800));
    }
    if (message) {
        await notify.sendNotify(`「阿里云盘签到报告」`, `${message}`);
    }
})();

async function main(refreshToken) {
    const accessToken = await getAccessToken(refreshToken);
    await $.wait(randomWait(1200, 2000));
    const signInCount = await AliSignIn(refreshToken, accessToken);
    // await $.wait(1000);
    // await getReward(accessToken, signInCount);
}

/**
 * 获取 access_token
 *
 * @returns {Promise<void>}
 */
async function getAccessToken(refreshToken) {
    const params = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    }
    const data = await sendRequest(API_CONFIG.ACCESS_TOKEN_API, 'post', params, {});
    if (!data.access_token) {
        console.log('获取access_token失败, refresh_token可能有误');
        process.exit(1);
    }
    message += `【用户昵称】${data.nick_name}(${data.user_name})\n`;
    return data.access_token;
}

/**
 * 签到
 *
 * @returns {Promise<void>}
 */
async function AliSignIn(refreshToken, accessToken) {
    const params = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    }
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    }
    const data = await sendRequest(API_CONFIG.SIGN_IN_API, 'post', params, headers);
    console.log(data.success ? '签到成功\n' : '签到失败\n');
    message += data.success ? '【签到状态】签到成功\n' : '【签到状态】签到失败\n'
    message += `【签到统计】已累计签到${data.result.signInCount}天\n`;
    // 返回签到天数
    return data.result.signInCount;
}

/**
 * 获取签到奖励
 *
 * @returns {Promise<void>}
 */
async function getReward(accessToken, signInCount) {
    const params = {
        signInDay: signInCount
    }
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    }
    const data = await sendRequest(API_CONFIG.GET_REWARD_API, 'post', params, headers);
    console.log(`奖励: ${data.result.notice}\n`);
    message += `【签到奖励】${data.result.notice}`
}


/**
 * 发送请求
 *
 * @param url 请求地址
 * @param method 请求方法
 * @param data 请求参数
 * @param header 请求头
 * @returns {Promise<any>} 请求结果
 */
async function sendRequest(url, method, data = {}, header = {}) {
    const options = {
        method,
        url,
        headers: header ? header : `Content-Type: application/json`,
        data
    };
    try {
        const response = await axios(options);
        return response.data;
    } catch (error) {
        // 只要请求出错那就推送消息提示下可能是 refresh_token 失效了
        console.log("请求失败：", error);
        console.log(`\n阿里账号【${$.index}】请求接口异常, 可能是 refresh_token 失效了, 请重新获取 refresh_token`)
        await notify.sendNotify(`「阿里云盘Cookie失效通知」`, `\n\n阿里账号【${$.index}】请求接口异常, 可能是 refresh_token 失效了, 请重新获取 refresh_token`);
    }
}