/**
 * @author Telegram@sudojia
 * @site https://blog.imzjw.cn
 * @date 2024/5/18 18:25
 * @description 百度贴吧自动签到
 */
const $ = require('./env').Env('百度贴吧自动签到');
const notify = $.isNode() ? require('./sendNotify') : '';
const axios = require('axios').default;
const crypto = require('crypto');
const tieBaList = process.env.TIE_BA_COOKIE ? process.env.TIE_BA_COOKIE.split('&') : [];
let message = '';

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
        $.index = i + 1;
        $.cookie = tieBaList[i];
        console.log(`\n*****开始第【${$.index}】个贴吧账号****\n`);
        message += `📣==========贴吧账号${$.index}==========📣\n`;
        await main();
    }
    if (message) {
        await notify.sendNotify(`「百度贴吧签到报告」`, `${message}`);
    }
})();

async function main() {
    const tbs = await getTBS()
    const followList = await getTieBaFollow();
    message += `【贴吧总计】${followList.length} 个\n`;
    for (let i = 0; i < followList.length; i++) {
        await signTieBa(followList[i], tbs);
        await $.wait(1000);
    }
}


/**
 * 获取 TBS
 *
 * @returns {Promise<*>}
 */
async function getTBS() {
    const data = await sendRequest(TIEBA_API.TBS_API, 'get', {});
    if (!1 === data.is_login) {
        console.log('cookie 已失效');
        return;
    }
    return data.tbs;
}

/**
 * 获取贴吧列表
 *
 * @returns {Promise<*[]>}
 */
async function getTieBaFollow() {
    const data = await sendRequest(TIEBA_API.FOLLOW_API, 'get', {})
    const likeForum = data.data.like_forum
    const follow = [];
    for (let i = 0; i < likeForum.length; i++) {
        follow.push(likeForum[i].forum_name);
        // if (likeForum[i].is_sign === 0) {
        // }
    }
    return follow;
}


/**
 * 签到函数
 *
 * @param forum_name 贴吧名
 * @param tbs tbs
 * @returns {Promise<void>}
 */
async function signTieBa(forum_name, tbs) {
    message += `\n**********「签到详情」**********\n`
    const sign = `kw=${forum_name}tbs=${tbs}tiebaclient!!!`;
    const encodedSign = encodeMd5(sign);
    const data = await sendRequest(TIEBA_API.SIGN_API, 'post', {
        kw: forum_name,
        tbs: tbs,
        sign: encodedSign
    });
    if ('0' === data.error_code) {
        console.log(`【${forum_name}】签到成功`);
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
 * @returns {Promise<any>} 请求结果
 */
async function sendRequest(url, method, data = {}) {
    const options = {
        method,
        url,
        headers: {
            'connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Host': 'tieba.baidu.com',
            'charset': 'UTF-8',
            'Cookie': `BDUSS=${$.cookie}`,
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88'
        },
        data
    };
    try {
        const response = await axios(options);
        return response.data;
    } catch (error) {
        console.log("请求失败：", error);
    }
}