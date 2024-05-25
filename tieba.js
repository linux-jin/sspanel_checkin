/**
 * @author Telegram@sudojia
 * @site https://blog.imzjw.cn
 * @date 2024/5/18 18:25
 * @description 百度贴吧自动签到
 */
const $ = require('./env').Env('百度贴吧自动签到');
const notify = $.isNode() ? require('./sendNotify') : '';
const randomWait = require('./utils/getRandomWait');
const axios = require('axios').default;
const crypto = require('crypto');
const tieBaList = process.env.TIE_BA_COOKIE ? process.env.TIE_BA_COOKIE.split('&') : [];
let message = '';
let success = [];

const TIEBA_API = {
    'TBS_API': 'http://tieba.baidu.com/dc/common/tbs',
    'FOLLOW_API': 'https://tieba.baidu.com/mo/q/newmoindex',
    'SIGN_API': 'http://c.tieba.baidu.com/c/c/forum/sign'
}

!(async () => {
    if (!tieBaList || tieBaList.length === 0) {
        console.log('请先设置环境变量【TIE_BA_COOKIE】');
        process.exit(1);
    }
    for (let i = 0; i < tieBaList.length; i++) {
        const cookie = tieBaList[i];
        console.log(`\n*****开始第【${i + 1}】个贴吧账号****\n`);
        message += `📣==========贴吧账号${i + 1}==========📣\n`;
        await main(cookie);
        await $.wait(randomWait(2000, 3000));
    }
    if (message) {
        await notify.sendNotify(`「百度贴吧签到报告」`, `${message}`);
    }
})();

async function main(cookie) {
    const tbs = await getTBS(cookie)
    const followList = await getTieBaFollow(cookie);
    await $.wait(randomWait(800, 1200));
    for (const followName of followList) {
        await signTieBa(followName, tbs, cookie);
        await $.wait(randomWait(1500, 2500));
    }
    console.log(`【签到统计】成功签到 ${success.length} 个, 失败 ${followList.length - success.length} 个`);
    message += `【贴吧总计】${followList.length} 个\n`;
    message += `【签到统计】成功签到 ${success.length} 个, 失败 ${followList.length - success.length} 个\n\n`;
}


/**
 * 获取 TBS
 *
 * @returns {Promise<*>}
 */
async function getTBS(cookie) {
    const data = await sendRequest(TIEBA_API.TBS_API, 'get', {}, cookie);
    if (!1 === data.is_login) {
        console.log('TBS 已失效！可能是 cookie 失效了');
        process.exit(1);
    }
    return data.tbs;
}

/**
 * 获取贴吧列表
 *
 * @returns {Promise<*[]>}
 */
async function getTieBaFollow(cookie) {
    const data = await sendRequest(TIEBA_API.FOLLOW_API, 'get', {}, cookie)
    const likeForum = data.data.like_forum
    return likeForum.map(forum => forum.forum_name);
}


/**
 * 签到函数
 *
 * @param forum_name 贴吧名
 * @param tbs tbs
 * @param cookie
 *
 * @returns {Promise<void>}
 */
async function signTieBa(forum_name, tbs, cookie) {
    const sign = `kw=${forum_name}tbs=${tbs}tiebaclient!!!`;
    const encodedSign = encodeMd5(sign);
    const data = await sendRequest(TIEBA_API.SIGN_API, 'post', {
        kw: forum_name,
        tbs: tbs,
        sign: encodedSign
    }, cookie);
    if ('0' === data.error_code) {
        success.push(forum_name);
        message += `【${forum_name}】签到成功, 连续签到：${data.user_info.cont_sign_num}天, 累计签到：${data.user_info.total_sign_num}天\n`
    }
}

/**
 * MD5 加密
 *
 * @param str 待加密字符串
 * @returns {string} 加密后的字符串
 */
function encodeMd5(str) {
    const hash = crypto.createHash('md5');
    hash.update(str, 'utf8');
    return hash.digest('hex');
}


/**
 * 发送请求
 *
 * @param url 请求地址
 * @param method 请求方法
 * @param data 请求参数
 * @param cookie cookie
 *
 * @returns {Promise<any>} 请求结果
 */
async function sendRequest(url, method, data = {}, cookie) {
    const options = {
        method,
        url,
        headers: {
            'connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Host': 'tieba.baidu.com',
            'charset': 'UTF-8',
            'Cookie': `BDUSS=${cookie}`,
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88'
        },
        data
    };
    try {
        const response = await axios(options);
        return response.data;
    } catch (error) {
        console.log("请求失败：", error.response.status, error.response.data);
    }
}