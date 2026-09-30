# 换物记 · Swapbook

一个本地换物网站，支持注册登录、发布闲置物品、上传图片、物品交换及现金报价，以及同意或婉拒交易请求。

前端使用 HTML、CSS 和原生 JavaScript；后端使用 Node.js 内置模块，无需安装第三方依赖。

## 本地运行

安装 Node.js（建议使用 24 LTS），克隆仓库后在仓库根目录执行：

```sh
cd exchange-market
node server.js
```

浏览器打开 <http://127.0.0.1:4173>。也可以使用 `node local-server.js` 启动。

如需更换端口，在 PowerShell 中执行：

```powershell
$env:PORT = "4174"
node server.js
```

首次运行会自动创建 `data/database.json` 和 `uploads/`，并生成演示用户及物品。演示账号为：

| 邮箱 | 密码 |
| --- | --- |
| mia@swap.local | mia123 |
| ken@swap.local | ken123 |

这些账号仅供本地演示。当前服务监听本机地址，适合本地开发；上线前需要单独处理生产配置和安全检查。

## 项目结构

```text
exchange-market/
├── index.html       # 页面入口
├── app.js           # 前端交互与 API 调用
├── style.css        # 页面样式
├── server.js        # HTTP 服务、认证和交易 API
├── local-server.js  # 兼容启动入口
├── assets/          # 网站内置图片，随代码提交
├── data/            # 本地数据库，不提交
└── uploads/         # 用户上传图片，不提交
```

## 团队协作

管理员在 GitHub 仓库的 **Settings → Collaborators**（组织仓库可能显示 **Collaborators and teams**）中邀请成员。成员接受邀请后，克隆仓库并按上面的步骤启动。

每次修改使用独立分支。以下命令以主分支为 `main` 为例；已有仓库应使用其实际默认分支：

```sh
git switch main
git pull --ff-only
git switch -c feature/your-change
# 修改代码并在本地验证
git add <修改的文件路径>
git commit -m "说明本次修改"
git push -u origin feature/your-change
```

然后在 GitHub 创建 Pull Request，说明修改内容及验证结果，由其他成员审查后合并。合并后，其他成员拉取主分支以获取更新。

数据库、会话、上传文件和 `.env` 配置只保留在本地，每位成员拥有独立的开发数据；GitHub 同步的是代码和内置资源。

## 提交前检查

在仓库根目录执行：

```sh
node --check exchange-market/server.js
node --check exchange-market/local-server.js
node --check exchange-market/app.js
git diff --check
git status --short
```

启动服务后，可用两个演示账号检查登录、物品展示和交易请求。提交前确认没有加入本地数据库、用户上传图片或账号凭据。
