const url = require("url");
/**
 * @author Telegram@sudojia
 * @site https://blog.imzjw.cn
 * @date 2023/11/21 09:13
 * @last Modified by sudojia
 * @last Modified time 2023/12/5 21:42
 * @description Steam 游玩时长查询
 */
const $ = require('./env').Env('Steam两周内游玩明细');
const notify = $.isNode() ? require('./sendNotify') : '';
const randomWait = require('./utils/getRandomWait');
const axios = require('axios').default;
let STEAM_TOKEN = process.env.STEAM_TOKEN, STEAM_64_ID = process.env.STEAM_64_ID, message = '';
const STEAM_API = 'http://api.steampowered.com';

const personaStateMap = {
    1: '在线',
    2: '忙碌',
    3: '离开',
    4: '暂停',
    5: '想要交易',
    6: '想要玩',
    0: '离线', // 默认状态
};

!(async () => {
    if (!STEAM_TOKEN) {
        console.log('请先设置环境变量【STEAM_TOKEN】')
        return;
    }
    if (!STEAM_64_ID) {
        console.log('请先设置环境变量【STEAM_64_ID】')
        return;
    }
    await getUser();
    await $.wait(randomWait(1000, 1200));
    await selectSteamTime();
    if (message) {
        console.log(message);
        await notify.sendNotify(`${$.name}`, `${message}`);
    }
})();

/**
 * 获取 Steam 用户名 https://developer.valvesoftware.com/wiki/Steam_Web_API
 *
 * @returns {Promise<unknown>}
 */
async function getUser() {
    const data = await sendRequest(`${STEAM_API}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_TOKEN}&steamids=${STEAM_64_ID}`, 'get', {});
    // 获取用户名
    let personaName = data.response.players[0].personaname;
    // 获取当前状态
    let getPersonaState = data.response.players[0].personastate;
    // 0: 离线 如果玩家的个人资料是私人的，则该值将始终为 "0" 、默认为 0
    // 除非用户已将其状态设置为寻求交易或寻求玩游戏，因为即使个人资料是私人的，错误也会导致这些状态出现。
    let personaState = personaStateMap[getPersonaState] || personaStateMap[0];
    // 获取 Steam 个人主页 URL
    let profileUrl = data.response.players[0].profileurl;
    // 获取当前正在游玩的游戏
    let gameExtrainfo = data.response.players[0].gameextrainfo == null ? '当前没有在游玩' : '当前正在游玩【' + data.response.players[0].gameextrainfo + '】';
    message += `【用户名】${personaName}\n【状态】${personaState}\n【主页】${profileUrl}\n【当前游玩】${gameExtrainfo}\n\n`
}

/**
 * 获取游玩时长
 * @returns {Promise<unknown>}
 */
async function selectSteamTime() {
    const data = await sendRequest(`${STEAM_API}/IPlayerService/GetRecentlyPlayedGames/v1?key=${STEAM_TOKEN}&steamid=${STEAM_64_ID}`, 'get', {});
    let gameList = data.response.games;
    message += `======过去两周内游玩情况======`
    for (let g of gameList) {
        // 获取总时长 分钟 / 60 = 小时
        let playtime_minute = g.playtime_forever / 60
        // 数据处理, 返回小时
        let playtime_hour = playtime_minute.toFixed(1)
        // 获取游戏名
        let game_name = g.name;
        message += '\n游戏名【' + game_name + '】\n总时长: ' + playtime_hour + ' h' + '\n================';
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
        headers: {},
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