# Netlify 部署指南 🚀

## 快速部署步骤

### 1. 登录 Netlify
访问 [https://app.netlify.com/](https://app.netlify.com/) 并使用 GitHub 账号登录。

### 2. 导入项目
1. 点击 **"Add new site"** → **"Import an existing project"**
2. 选择 **"Deploy with GitHub"**
3. 授权 Netlify 访问你的 GitHub 仓库
4. 选择仓库：`IwannaYuJie/roguelike`

### 3. 配置构建设置
Netlify 会自动检测到项目根目录下的 `netlify.toml` 配置文件，但为了确保正确，请验证以下设置：

- **Base directory**: `elemental-overload`
- **Build command**: `npm run build`
- **Publish directory**: `elemental-overload/dist`

### 4. 部署
点击 **"Deploy site"** 按钮，Netlify 会自动：
1. 拉取代码
2. 安装依赖 (`npm install`)
3. 运行构建 (`npm run build`)
4. 发布静态文件

### 5. 访问你的游戏
部署完成后，Netlify 会生成一个临时域名，类似：
```
https://random-name-123456.netlify.app
```

你也可以在 Netlify 面板中自定义域名。

## 持续部署 (CI/CD)

配置完成后，每次你推送代码到 `main` 分支，Netlify 都会自动触发重新构建和部署。

```bash
git add .
git commit -m "你的提交信息"
git push origin main
```

## 注意事项

### Node 版本警告
本地开发环境的 Node.js 版本为 `v20.10.0`，低于推荐的 `20.19.0+`。

但不用担心！**Netlify 的构建环境默认使用最新的 LTS 版本**，所以构建不会出问题。

如果想在本地也能正常构建，建议升级 Node.js：
1. 访问 [https://nodejs.org/](https://nodejs.org/) 下载最新 LTS 版本
2. 或使用 nvm-windows 切换版本：
   ```bash
   nvm install 22.12.0
   nvm use 22.12.0
   ```

### 构建成功标志
如果在本地看到以下输出，说明构建配置正确：
```
✓ built in X.XXs
dist/index.html
dist/assets/index-xxxxxxxx.js
```

### 查看构建日志
在 Netlify 面板的 **"Deploys"** 标签页可以查看详细的构建日志，方便排查问题。

## 当前状态
✅ 项目已推送到 GitHub  
✅ Netlify 配置文件已创建  
✅ 本地构建测试通过  
⏳ 等待你在 Netlify 完成导入与部署  

部署完成后，你就能在浏览器里看到《元素超载》的原型啦！🐶✨
