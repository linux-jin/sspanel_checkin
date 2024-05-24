/**
 * @author Telegram@sudojia
 * @site https://blog.imzjw.cn
 * @date 2022/01/19 21:26
 * @last Modified by Telegram@sudojia
 * @last Modified time 2024/05/21 03:39
 * @description 掘金自动签到
 */
const $ = require('./env').Env('掘金自动签到');
const notify = $.isNode() ? require('./sendNotify') : '';
const axios = require('axios').default;
let cookiesArr = process.env.JUEJIN_COOKIE ? process.env.JUEJIN_COOKIE.split('&') : [], message = '';
const config = {
    // 掘金 API
    JUEJIN_API: 'https://api.juejin.cn',
    // 是否十连抽
    ENABLE_TEN_DRAW: process.env.ENABLE_TEN_DRAW || false,
    // 十连抽次数
    TEN_DRAW_NUM: parseInt(process.env.TEN_DRAW_NUM) || 1,
    COOKIE: ''
};
// 定义任务类型对应的任务名称
// 移动端每日登录访问和发布文章没写
const taskTypes = {
    6: '发布沸点任务',
    7: '评论文章任务',
    8: '评论沸点任务',
    9: '点赞文章任务',
    10: '点赞沸点任务',
    11: '关注掘友任务',
    12: '收藏文章任务'
};
if (!cookiesArr || cookiesArr.length === 0) {
    console.log('请设置环境变量【JUEJIN_COOKIE】\n');
    process.exit(1);
}
!(async () => {
    for (let i = 0; i < cookiesArr.length; i++) {
        config.COOKIE = cookiesArr[i];
        const index = i + 1;
        console.log(`\n*****开始第【${index}】个账号****\n`);
        message += `📣==========掘金账号${index}==========📣\n`;
        try {
            if (403 === await checkStatus()) {
                await notify.sendNotify(`「掘金签到报告」`, `掘金账号${index} Cookie 已失效，请重新登录获取 Cookie`);
                continue;
            }
            await main();
        } catch (e) {
            console.error(`账号${index}发生异常: ${e}`);
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
    message += `「社区活跃任务详情」\n`
    // 任务列表
    await taskList();
    await $.wait(2000);
    await getUserName();
    await $.wait(1000);
    await checkIn();
    await $.wait(1000);
    const oreNum = await getOreNum();
    message += `【总矿石数】${oreNum} 矿石\n`
    // 签到统计
    await getCount();
    await $.wait(1000);
    const freeCount = await queryFreeLuckyDrawCount();
    if (freeCount === 0) {
        console.log(`白嫖次数已用尽~暂不抽奖\n`)
        message += `【抽奖信息】白嫖次数已用尽~\n`
    } else {
        await luckyDraw();
    }
    await $.wait(1000);
    await geMyLucky();
    console.log('开始执行十连抽...')
    message += `【十连抽详情】\n`
    if (!config.ENABLE_TEN_DRAW) {
        message += `检测到未配置十连抽环境变量，取消十连抽...\n如需执行十连抽请配置环境变量【ENABLE_TEN_DRAW】为 true\n\n`;
        console.log(`检测到未配置十连抽环境变量，取消十连抽...\n如需执行十连抽请配置环境变量【ENABLE_TEN_DRAW】为 true`);
        return;
    }
    console.log(`检测到你已开启十连抽，正在为你执行十连抽...\n等待两秒...`);
    await $.wait(2000);
    if (2000 > oreNum) {
        message += `妈的，全部身家加起来矿石都不足 2000，还想十连抽???\n\n`
        console.log(`妈的，全部身家加起来矿石都不足 2000，还想十连抽???`);
        return;
    }
    console.log(`十连抽次数默认为 ${config.TEN_DRAW_NUM} 次\n如需修改，请设置环境变量【TEN_DRAW_NUM】`)
    for (let i = 0; i < config.TEN_DRAW_NUM; i++) {
        await tenDraw();
        if (i < config.TEN_DRAW_NUM - 1) {
            await $.wait(1000);
        }
    }
}

/**
 * 任务列表（主要是增加掘友分）
 *
 * @returns {Promise<void>}
 */
async function taskList() {
    let data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/user_growth/task_list', 'post', {
        growth_type: 1
    });
    let growthTasks = data.data.growth_tasks;
    for (const taskArray in growthTasks) {
        // 1没任务，3社区学习，4社区影响力，5社区活跃、暂时做社区活跃任务
        if (growthTasks.hasOwnProperty(taskArray) && '5' === taskArray) {
            const tasks = growthTasks[taskArray];
            for (const task of tasks) {
                // 没写移动端每日登录访问和发布文章任务，所以过滤掉吧，有时间的可以和我提 PR，感谢
                if ([4, 5].includes(task.task_id)) {
                    continue;
                }
                for (let i = 0; i < task.limit - task.done; i++) {
                    await performTask(task);
                }
            }
        }
    }
    await $.wait(2000);
    // 任务完成后重新调用接口更新任务状态
    data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/user_growth/task_list', 'post', {
        growth_type: 1
    });
    growthTasks = data.data.growth_tasks;
    Object.entries(growthTasks).forEach(([growthId, tasks]) => {
        if (['1', '3', '4'].includes(growthId)) {
            return;
        }
        tasks = tasks.filter(task => task.task_id !== 4 && task.task_id !== 5);
        if (tasks && tasks.length > 0) {
            tasks.forEach(t => {
                message += `【${t.title}】已完成${t.done}/${t.limit}\n`;
            });
            message += `【今日掘友分】+${data.data.today_jscore}\n`
        }
    });
}

/**
 * 执行任务列表
 *
 * @param task
 * @returns {Promise<void>}
 */
async function performTask(task) {
    // 获取文章id
    const postId = await getPostId();
    // 获取沸点id
    const msgId = await getBoilingId();
    const taskType = taskTypes[task.task_id] || '未知任务';
    switch (task.task_id) {
        case 6:
            await performPublishBoilingTask(taskType);
            break;
        case 7:
            await performCommentArticleTask(taskType, postId);
            break;
        case 8:
            await performBoilingCommentTask(taskType, msgId);
            break;
        case 9:
            await performLikeArticleTask(taskType, postId);
            break;
        case 10:
            await performLikeBoilingTask(taskType, msgId);
            break;
        case 11:
            await performFollowTask(taskType);
            break;
        case 12:
            await performCollectArticleTask(taskType, postId);
            break;
    }
}

/**
 * 执行发布沸点任务
 *
 * @param taskType
 * @returns {Promise<void>}
 */
async function performPublishBoilingTask(taskType) {
    const content = await getWenAn()
    console.log(`开始${taskType}\n等待3秒...`)
    await $.wait(1000);
    const msgId = await publishBoiling(content)
    console.log(`开始删除沸点\n等待10秒...`)
    await $.wait(10000);
    await deleteBoiling(msgId);
}

/**
 * 执行收藏文章任务
 *
 * @param taskType 任务类型
 * @param postId 文章id
 *
 * @returns {Promise<void>}
 */
async function performCollectArticleTask(taskType, postId) {
    const collectionId = await getCollectionList(postId);
    await $.wait(1300);
    // 添加文章到收藏夹
    console.log(`开始${taskType}\n等待3秒...`)
    await $.wait(3000);
    await addPostToCollection(postId, collectionId);
    console.log(`开始取消收藏文章\n等待3秒...`)
    await $.wait(3000);
    await deletePostFromCollection(postId)
}

/**
 * 执行关注任务
 *
 * @param taskType
 * @returns {Promise<void>}
 */
async function performFollowTask(taskType) {
    console.log(`开始${taskType}\n等待3秒...`)
    await $.wait(3000);
    const userId = await getAuthorList();
    await $.wait(1300);
    await followAuthorAndCancel(userId);
    console.log(`开始取关掘友\n等待3秒...`)
    await $.wait(3000);
    await followAuthorAndCancel(userId, 1);
}

/**
 * 执行点赞沸点任务
 *
 * @param taskType 任务类型
 * @param msgId
 * @returns {Promise<void>}
 */
async function performLikeBoilingTask(taskType, msgId) {
    console.log(`开始${taskType}\n等待5秒...`)
    await $.wait(5000);
    await save(msgId, 4);
    console.log(`开始取消点赞沸点\n等待5秒...`)
    await $.wait(5000);
    await cancelSave(msgId, 4);
}

/**
 * 执行点赞文章任务
 *
 * @param taskType 任务类型
 * @param postId 文章id
 * @returns {Promise<void>}
 */
async function performLikeArticleTask(taskType, postId) {
    console.log(`开始${taskType}\n等待5秒...`);
    await $.wait(5000);
    await save(postId);
    console.log(`开始取消点赞文章\n等待5秒...`)
    await $.wait(5000);
    await cancelSave(postId)
}

/**
 * 执行沸点评论任务
 *
 * @param taskType 任务类型
 * @param msgId
 * @returns {Promise<void>}
 */
async function performBoilingCommentTask(taskType, msgId) {
    console.log(`开始${taskType}\n等待5秒...`);
    await $.wait(5000);
    const boilingCommentId = await commentPublish(msgId, 4);
    console.log(`开始删除沸点评论...\n等待5秒...`);
    await $.wait(5000);
    await deleteComment(boilingCommentId);
}

/**
 * 执行评论文章任务
 *
 * @param taskType 任务类型
 * @param postId
 * @returns {Promise<void>}
 */
async function performCommentArticleTask(taskType, postId) {
    console.log(`开始${taskType}\n等待5秒...`);
    await $.wait(5000);
    // 获取评论id
    const commentId = await commentPublish(postId);
    console.log(`开始删除评论...\n等待5秒`)
    await $.wait(5000);
    await deleteComment(commentId);
}

/**
 * 随机获取一篇文章 id
 *
 * @returns {Promise<*>}
 */
async function getPostId() {
    // 获取分类列表
    const categoryList = await queryCategory();
    if (categoryList.length === 0) {
        console.log("分类列表为空");
        return;
    }
    // 如果categoryList不为空，则使用Math.random()生成随机数，并乘以categoryList的长度，再使用Math.floor()向下取整得到一个随机的索引
    const categoryIndex = Math.floor(Math.random() * categoryList.length);
    // 使用随机索引categoryIndex从categoryList中取出对应的分类ID，并将其赋值给randomCategoryId变量。
    const randomCategoryId = categoryList[categoryIndex];
    // 从随机获取的分类 id 中获取文章列表，用于点赞，收藏，评论
    const articleList = await getPostByCategoryId(randomCategoryId);
    if (articleList.length === 0) {
        console.log("文章列表为空");
        return;
    }
    // 从文章列表中随机获取一篇文章 id
    return articleList[Math.floor(Math.random() * 20) + 1];
}

/**
 * 获取分类列表
 *
 * @returns {Promise<*[]>}
 */
async function queryCategory() {
    const data = await sendRequest(config.JUEJIN_API + '/tag_api/v1/query_category_briefs', 'get', {});
    const categoryList = [];
    if ('success' === data.err_msg) {
        for (let category of data.data) {
            categoryList.push(category.category_id);
        }
    }
    return categoryList;
}

/**
 * 通过分类id获取文章列表
 *
 * @param cate_id 分类id
 * @returns {Promise<*[]>}
 */
async function getPostByCategoryId(cate_id) {
    const articleList = [];
    const data = await sendRequest(config.JUEJIN_API + '/recommend_api/v1/article/recommend_cate_feed', 'post', {
        id_type: 2,
        sort_type: 200,
        cate_id: cate_id,
        cursor: "0",
        limit: 20  // 获取 20 条文章id
    });
    if ('success' === data.err_msg) {
        for (let article of data.data) {
            articleList.push(article.article_id);
        }
    }
    return articleList;
}

/**
 * 获取沸点id
 *
 * @returns {Promise<void>}
 */
async function getBoilingId() {
    const boilingList = [];
    const data = await sendRequest(config.JUEJIN_API + '/recommend_api/v1/short_msg/recommend', 'post', {
        id_type: 4,
        sort_type: 300,
        cursor: "0",
        limit: 20
    });
    for (let item of data.data) {
        boilingList.push(item.msg_id)
    }
    return boilingList[Math.floor(Math.random() * 50) + 1];
}

/**
 * 获取文案
 *
 * @returns {Promise<void>}
 */
async function getWenAn() {
    const response = await axios.get('https://api.vvhan.com/api/text/joke?type=json');
    return response.data.data.content
}

/**
 * 发布沸点
 *
 * @param content
 * @param retryCount 重试次数
 * @returns {Promise<number>}
 */
async function publishBoiling(content, retryCount = 0) {
    const data = await sendRequest(config.JUEJIN_API + '/content_api/v1/short_msg/publish', 'post', {
        content: content,
        mentions: [],
        sync_to_org: false
    });
    if (2002 === data.err_no && retryCount < 5) {
        console.log(`沸点内容过少，重试第${retryCount + 1}次`)
        return publishBoiling(content, retryCount + 1);
    }
    if ('success' === data.err_msg) {
        console.log('发布沸点成功！');
        return data.data.msg_id;
    }
    return -1;
}

/**
 * 删除沸点
 *
 * @param msgId 沸点id
 * @returns {Promise<void>}
 */
async function deleteBoiling(msgId) {
    const data = await sendRequest(config.JUEJIN_API + '/content_api/v1/short_msg/delete', 'post', {msg_id: msgId});
    if ('success' === data.err_msg) {
        console.log('删除沸点成功！')
    }
}

/**
 * 发布评论
 *
 * @param itemId 文章id或者沸点id
 * @param itemType 2 文章 4 沸点
 *
 * @returns {Promise<void>}
 */
async function commentPublish(itemId, itemType = 2) {
    // 就写死一个 6 吧，不知道加点啥评论了
    const comment = '6';
    const data = await sendRequest(config.JUEJIN_API + '/interact_api/v1/comment/publish', 'post', {
        client_type: 2608,
        item_id: itemId,
        item_type: itemType,
        comment_content: comment,
        comment_pics: []
    });
    if ('success' === data.err_msg) {
        console.log('评论成功！');
        return data.data.comment_id;
    }
}

/**
 * 删除评论
 *
 * @param commentId 评论id
 * @returns {Promise<void>}
 */
async function deleteComment(commentId) {
    const data = await sendRequest(config.JUEJIN_API + '/interact_api/v1/comment/delete', 'post', {
        comment_id: commentId,
    });
    if ('success' === data.err_msg) {
        console.log('删除评论成功！');
    }
}

/**
 * 点赞
 *
 * @param itemId 文章id或者沸点id
 * @param itemType 2 文章 4 沸点
 *
 * @returns {Promise<void>}
 */
async function save(itemId, itemType = 2) {
    const data = await sendRequest(config.JUEJIN_API + '/interact_api/v1/digg/save', 'post', {
        item_id: itemId,
        item_type: itemType,
        client_type: 2608
    });
    if ('success' === data.err_msg) {
        console.log('点赞成功');
    }
}

/**
 * 取消点赞
 *
 * @param itemId 文章id或者沸点id
 * @param itemType 2 文章 4 沸点
 *
 * @returns {Promise<void>}
 */
async function cancelSave(itemId, itemType = 2) {
    const data = await sendRequest(config.JUEJIN_API + '/interact_api/v1/digg/cancel', 'post', {
        item_id: itemId,
        item_type: itemType,
        client_type: 2608
    });
    if ('success' === data.err_msg) {
        console.log(`取消点赞成功！`);
    }
}

/**
 * 获取掘友列表
 *
 * @returns {Promise<*>}
 */
async function getAuthorList() {
    const userList = [];
    const data = await sendRequest(config.JUEJIN_API + '/user_api/v1/author/recommend?limit=20', 'get');
    for (let user of data.data) {
        userList.push(user.user_id);
    }
    return userList[Math.floor(Math.random() * 99) + 1];
}

/**
 * 关注、取关掘友
 *
 * @param userId
 * @param type 0 关注掘友接口，1 取消关注掘友接口，默认 0
 *
 * @returns {Promise<void>}
 *
 */
async function followAuthorAndCancel(userId, type = 0) {
    let path = type === 1
        ? '/interact_api/v1/follow/undo'
        : '/interact_api/v1/follow/do';
    const data = await sendRequest(config.JUEJIN_API + path, 'post', {
        id: userId,
        type: 1
    });
    if ('success' === data.err_msg) {
        console.log(type === 1 ? '取关掘友成功！' : '关注掘友成功！');
    }
}

/**
 * 获取收藏夹列表，并返回第一个收藏夹id
 *
 * @param postId
 * @returns {Promise<void>}
 */
async function getCollectionList(postId) {
    const data = await sendRequest(config.JUEJIN_API + '/interact_api/v2/collectionset/list', 'post', {
        limit: 10,
        cursor: "0",
        article_id: postId
    });
    return data.data[0].collection_id
}

/**
 * 添加文章到收藏夹
 *
 * @param postId 文章id
 * @param collectionId 收藏夹id
 *
 * @returns {Promise<void>}
 */
async function addPostToCollection(postId, collectionId) {
    const data = await sendRequest(config.JUEJIN_API + '/interact_api/v2/collectionset/add_article', 'post', {
        article_id: postId,
        select_collection_ids: [collectionId],
        unselect_collection_ids: [],
        is_collect_fast: false
    });
    if ('success' === data.err_msg) {
        console.log('收藏文章成功！');
    }
}

/**
 * 取消收藏
 *
 * @param postId 文章id
 *
 * @returns {Promise<void>}
 */
async function deletePostFromCollection(postId) {
    const data = await sendRequest(config.JUEJIN_API + '/interact_api/v2/collectionset/delete_article', 'post', {
        article_id: postId
    });
    if ('success' === data.err_msg) {
        console.log('取消收藏成功！');
    }
}

/**
 * 检查状态
 *
 * @returns {Promise<void>}
 */
async function checkStatus() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/get_today_status', 'get', '');
    return data.data.err_no
}

/**
 * 签到函数
 *
 * @returns {*}
 */
async function checkIn() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/check_in', 'post', '')
    if (15001 === data.err_no) {
        console.log(data.err_msg);
        message += `【签到信息】${data.err_msg}\n`
        return;
    }
    message += `【签到信息】签到成功, 获得 ${data.data.incr_point} 矿石\n`
    console.log(`签到成功，获得 ${data.data.incr_point} 矿石`);
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
    return data.data;
}

/**
 * 查询免费抽奖次数
 */
async function queryFreeLuckyDrawCount() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/lottery_config/get', 'get', '')
    // 获取免费抽奖次数
    return data.data.free_count;
}


/**
 * 统计签到天数, 没什么用~
 */
async function getCount() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/get_counts', 'get', '');
    message += `【签到统计】已连续签到${data.data.cont_count}天、累计签到${data.data.sum_count}天\n`
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
 * 获取幸运值
 *
 * @returns {Promise}
 */
async function geMyLucky() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/lottery_lucky/my_lucky', 'post', {});
    if ('success' === data.err_msg) {
        message += `【当前幸运值】${data.data.total_value}/6000\n`
    }
}

/**
 * 十连抽
 */
async function tenDraw() {
    const data = await sendRequest(config.JUEJIN_API + '/growth_api/v1/lottery/ten_draw', 'post', '');
    // 单抽加 10 幸运值、十连抽加 100 幸运值，6000 满格
    console.log(`本次十连抽共消耗 2000 矿石数\n十连抽奖励为: `)
    $.lotteryBases = data.data.LotteryBases;
    for (let draw of $.lotteryBases) {
        message += `抽中了${draw.lottery_name}\n`
        console.log(`抽中了${draw.lottery_name}`)
        await $.wait(1000);
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
            "Cookie": `sessionid=${config.COOKIE}`,
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