<p align="center">
    <h1 align="center">scripts</h1>
</p>
<p align="center">
    一些脚本，每天定时自动签到
    <br />
    <br />
    <a href="https://github.com/sudojia/scripts/issues/new">上报 Bug、意见反馈</a>
  </p>




- [💍介绍](#介绍)
- [😍特点](#特点)
- [👗适用人群](#适用人群)
- [🔑*Env*](#Env)
- [🔛使用](#使用)
- [🎯TODO](#TODO)
- [⭐点个 Star 支持作者](#点个-star-支持作者)
- [⚖️许可证](#%EF%B8%8F许可证)
- [🕛历程](#历程)

## 💍介绍

基于 GitHub Actions 每天定时自动签到脚本，支持多账号，目前仅支持 `SSPANEL` 、[掘金社区](https://juejin.cn/)

多个消息平台（Telegram、Server 酱、Bark、PushPlus、钉钉等）服务推送。

## 😍特点

- ~~💰~~ 免费（项目运行在 GitHub Actions 上.）
- 🔗 多网站
- 📯 多账号

## 👗适用人群

- 老少皆宜

- 有这个需求的人

- SSPANEL 断签 7 天或者断签某天就会把你号给删的那种 ✈️

  ![images](https://cdn.jsdelivr.net/gh/sudojia/sspanel_checkin/img/fources.jpg)
  
- 掘金签到获取矿石，用于抽奖、兑换！


## 🔑*Env*

`Settings - Secrets - New repository secret`

> 需要使用哪个就使用哪个的变量

### 掘金社区

|      Name       |           Value            |                             说明                             |
| :-------------: | :------------------------: | :----------------------------------------------------------: |
| `JUEJIN_COOKIE` | eg:  `xxxxxxxxxxxxxxxxxxx` | 掘金 Cookie，打开[掘金社区](https://juejin.cn/) F12，选择 Application，点击 Cookies<br>只要 `sessionid` 的值并填入 Secrets 即可，多个掘金号用 `&` 隔开<br>eg: `xxxxxxxx&xxxxxxxx` |

![images](https://img2.imgtp.com/2024/05/19/M3EbSqId.png)

### SSPANEL面板

|      Name       |                      Value                      |                             说明                             |
| :-------------: | :---------------------------------------------: | :----------------------------------------------------------: |
| `SITE_ACCOUNTS` | 要执行签到的`网站,账号:密码`，多个请用 `&` 分割 | 单账号填写规则 e.g：`https://paolu.com,aaa@gmail.com:123456`<br/>多个填写规则：`https://aaa.com,aaa@gmail.com:aaa&https://bbb.com,bbb@gmail.com:bbb&...以此类推`<br/>中文说明：`网站,账号:密码`，多个：`网站,账号:密码&网站,账号:密码`<br/>网站与账号密码之间用`英文逗号`（`,`）分割，账号与密码之间用`英文冒号`（`:`）分割 |

**说明**

1. SSPANEL 签到暂不支持密码带  `,`  与  `:`  的字符！
2. **<font color='red'>SSPANEL 签到暂不支持带有图形验证码的机场网站！</font>**
3. 如果你使用 Telegram 进行消息推送，那么在 Bot 创建后需要先给 Bot 发送一条消息，Bot 才能给用户发消息 [issues#9](https://github.com/sudojia/scripts/issues/9)

### 获取 Steam 两周内游玩详情

每周六的早上八点执行, 可自行 [Fork](https://github.com/login?return_to=%2Fsudojia%2Fscripts) 后更改 [stam_playtime.yml](https://github.com/sudojia/scripts/blob/83eeb06c36f7a2021d358262709a5a82ced01b2f/.github/workflows/stam_playtime.yml#L7)

|     Name      |                            Value                             |                       说明                       |
| :-----------: | :----------------------------------------------------------: | :----------------------------------------------: |
| `STEAM_TOKEN` | 前往 https://steamcommunity.com/dev/apikey 注册你的 Steam Web API 密钥<br>eg: AB2C3xxxxxxxxxxxxxxxxx64xxxx | 填入你的密钥<br>eg: AB2C3xxxxxxxxxxxxxxxxx64xxxx |
| `STEAM_64_ID` | 前往 https://steamid.top/ 获取你的 64 位 Steam ID<br>也可登录 [Steam](https://steamcommunity.com/login/home/) 并前往你的 Steam 个人主页 URL 地址栏直接获取<br>https://steamcommunity.com/profiles/76561xxxxxxxxx/<br>URL 最后那一串数字即是 64 位 Steam ID |                eg:76561xxxxxxxxx                 |

### 阿里云盘

|        Name         |                Value                |                  说明                   |
| :-----------------: | :---------------------------------: | :-------------------------------------: |
| `ALI_REFRESH_TOKEN` | eg: `e7b02b2k52074om8td187c62952cf` | 阿里云盘 referesh token 多个用 `&` 分开 |

如何获取 **referesh token?**

**第一种**：打开[阿里云盘](https://www.aliyundrive.com/)，登录后 `F12` 在控制台输入以下代码即可获取

```javascript
JSON.parse(localStorage.token).refresh_token
```

**第二种**： 使用 Alist 的在线获取

打开 [Alist 文档#刷新令牌](https://alist.nn.ci/zh/guide/drivers/aliyundrive.html#%E5%88%B7%E6%96%B0%E4%BB%A4%E7%89%8C)，点击获取 Token，然后使用阿里云盘 APP 扫描，扫描完成后再点击一次即可获取

两种方式任选一种获取 `Referesh Token `

### 百度贴吧

|      Name       |                Value                |                             说明                             |
| :-------------: | :---------------------------------: | :----------------------------------------------------------: |
| `TIE_BA_COOKIE` | eg: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | 打开[百度贴吧](https://tieba.baidu.com/) -> F12，选择 Application，点击 Cookies<br/>只要 `BDUSS` 的值即可<br>多个账号用 `&` 分开 |

![images](https://img2.imgtp.com/2024/05/19/HnlsgpaF.png)

### 司机社

|     Name     |          Value          |                             说明                             |
| :----------: | :---------------------: | :----------------------------------------------------------: |
| `SJS_COOKIE` | eg: `司机社网站@cookie` | 打开司机社网站，F12，选择 Application，点击 Cookies<br/>获取键值对：`SgL6_2132_auth=xxxxxxxxxxx;SgL6_2132_saltkey=xxxxxx` |

**说明：**

由于司机社分站有很多，所以任意选择一个网站登录之后，获取 `SgL6_2132_auth` 和 `SgL6_2132_saltkey` 的值即可（包括键也要填写）

网站和 cookie 之间用 `@` 隔开，多个账号用 `&` 隔开。第二个的键值对后面就不要加 `;` 了

单个填写示例：

```markdown
https://xxxxx.com@SgL6_2132_auth=xxxxxxxxxxx;SgL6_2132_saltkey=xxxxxx
```

多个填写示例：用 `&` 隔开

```markdown
https://xxxxx.com@SgL6_2132_auth=xxxxxxxxxxx;SgL6_2132_saltkey=xxxxxx&https://xxxxx.com@SgL6_2132_auth=xxxxxxxxxxx;SgL6_2132_saltkey=xxxxxx
```

### 消息推送变量（可选）

如果你想要程序执行后进行消息推送，那么任选一种或多种方式进行配置

|       Name        |                             归属                             |  属性  |                             说明                             |
| :---------------: | :----------------------------------------------------------: | :----: | :----------------------------------------------------------: |
|    `PUSH_KEY`     |                      微信 server 酱推送                      | 非必须 | server 酱的微信通知[官方文档](http://sc.ftqq.com/3.version)，已兼容 [Server 酱·Turbo 版](https://sct.ftqq.com/) |
|    `BARK_PUSH`    | [BARK 推送](https://apps.apple.com/us/app/bark-customed-notifications/id1403753865) | 非必须 | IOS 用户下载 BARK 这个 APP，填写内容是 app 提供的`设备码`<br>例如：https://api.day.app/123 ，那么此处的设备码就是 `123` |
|   `BARK_SOUND`    | [BARK 推送](https://apps.apple.com/us/app/bark-customed-notifications/id1403753865) | 非必须 | bark 推送声音设置，例如 `choo`，具体值请在 `bark`-`推送铃声`-`查看所有铃声` |
|  `TG_BOT_TOKEN`   |                        Telegram 推送                         | 非必须 | `TG_BOT_TOKEN` 和 `TG_USER_ID` 两者必需<br>填写自己申请 [@BotFather](https://t.me/BotFather)的 Token<br>如 `10xxx4:AAFcqxxxxgER5uw` |
|   `TG_USER_ID`    |                        Telegram 推送                         | 非必须 | `TG_BOT_TOKEN` 和 `TG_USER_ID` 两者必需<br/>私聊它 [@userinfobot](https://t.me/userinfobot) 随便发点什么即可获取到自己的 ID |
|  `DD_BOT_TOKEN`   |                           钉钉推送                           | 非必须 | (`DD_BOT_TOKEN` 和 `DD_BOT_SECRET` 两者必需)[官方文档](https://developers.dingtalk.com/document/app/custom-robot-access) <br>只需 `https://oapi.dingtalk.com/robot/send?access_token=XXX` 等于 `=` 符号后面的 XXX 即可 |
|  `DD_BOT_SECRET`  |                           钉钉推送                           | 非必须 | (`DD_BOT_TOKEN` 和 `DD_BOT_SECRET` 两者必需) ，密钥，机器人安全设置页面，加签一栏下面显示的 SEC 开头的 `SECXXXXXXXXXX` 等字符，注：钉钉机器人安全设置只需勾选`加签`即可，其他选项不要勾选 |
|    `QYWX_KEY`     |                      企业微信机器人推送                      | 非必须 | 密钥，企业微信推送 webhook 后面的 key [详见官方说明文档](https://work.weixin.qq.com/api/doc/90000/90136/91770) |
|  `IGOT_PUSH_KEY`  |                          iGot 推送                           | 非必须 | iGot 聚合推送，支持多方式推送，确保消息可达。 [参考文档](https://wahao.github.io/Bark-MP-helper ) |
| `PUSH_PLUS_TOKEN` |                        pushplus 推送                         | 非必须 | 微信扫码登录后一对一推送或一对多推送下面的 token(您的 Token)<br>[官方网站](http://www.pushplus.plus/) |
| `PUSH_PLUS_USER`  |                        pushplus 推送                         | 非必须 | 一对多推送的 “群组编码”（一对多推送下面 -> 您的群组(如无则新建)->群组编码）<br>注：(1、需订阅者扫描二维码  2、如果您是创建群组所属人，也需点击“查看二维码”扫描绑定，否则不能接受群组消息推送)<br>只填 `PUSH_PLUS_TOKEN` 默认为一对一推送 |

## 🔛使用

1. 右上角 Fork 该项目

2. 在仓库的  `Settings - Secrets - New repository secret`  添加变量，变量说明请看  [🔑Env](#env)

3. 点击仓库中的 Actions，点击图中所示

   ![image](https://cdn.jsdelivr.net/gh/sudojia/sspanel_checkin/img/20210927171440.jpg)

   看图

   ![image](https://cdn.jsdelivr.net/gh/sudojia/sspanel_checkin/img/20210927171527.jpg)

   继续看图

   ![image](https://cdn.jsdelivr.net/gh/sudojia/sspanel_checkin/img/20210927171547.jpg)

   执行成功，如图，如果报错，不妨提个 [issues](https://github.com/sudojia/sspanel_checkin/issues/new)

   ![image](https://cdn.jsdelivr.net/gh/sudojia/sspanel_checkin/img/20210927171605.jpg)


## 🎯TODO

- [x] 多账号
- [x] 多网站
- [x] 消息推送
- [ ] TODO

## ⭐点个 Star 支持作者

<p align='center'>
  <img src="https://api.star-history.com/svg?repos=sudojia/scripts&type=Date">
</p>

## ⚖️许可证

本脚本库使用 [GPLv3](https://github.com/sudojia/scripts/blob/master/LICENSE) 许可证，脚本库中任何脚本未经允许**不可商用**。宣传或转载时请带上[本脚本库链接](https://github.com/sudojia/scripts)。

## 🕛历程

|    时间    |                             事件                             |
| :--------: | :----------------------------------------------------------: |
| 2024-05-21 | 掘金社区大更新<br>1. 添加了成长等级自动任务、目前只写了社区活跃下的任务<br>2. 移动端每日登录访问和发布文章任务有时间再写 |
| 2024-05-20 |                      新增司机社签到脚本                      |
| 2024-05-18 |                新增阿里云盘、百度贴吧签到脚本                |
| 2024-05-17 |               脚本库优化并使用 axios 发送请求                |
| 2023-11-21 |                   新增 Steam 游玩时长获取                    |
| 2022-09-27 |               移除葫芦侠（葫芦侠加了签名参数）               |
| 2022-01-20 | 1. 新增掘金社区签到&抽奖脚本<br>2. 应网友要求新增葫芦侠签到（一开始还以为看剧的葫芦...） |
| 2021-09-27 | SSPANLE 面板更改写法，采用一个变量<br>单个规则为：`网站,账号:密码` 多个：`网站,账号:密码&网站,账号:密码` |
| 2021-09-26 | 1. 优化 SSPANEL 面板支持多账号、多网站！<br>2. 新增多个消息推送（Telegram、server 酱、Bark、PushPlus、钉钉等） |
| 2021-09-25 |                  新增 SSPANEL 面板签到脚本                   |
