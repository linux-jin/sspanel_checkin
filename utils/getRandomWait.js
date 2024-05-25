/**
 * 随机等待时间
 *
 * @param min 最小值
 * @param max 最大值
 *
 * @returns {*} 随机数
 */
function getRandomWait(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = getRandomWait;