# hexo-obsidian-backlink
根据 obsidian 中的 双链 指向具体的文件包括附件的链接。
This plugin is for transfer Obsidian-type backlink to standard hexo in-site post link.

# 仓库地址:
https://github.com/pondered/hexo-obsidian-backlink

# install 安装
```js
npm install hexo-obsidian-backlink --save
```

# 本插件理论上支持 所有 wiki 链接以及 markdown 链接
例如：
1. `[[dd]]`  
2. `[dd](dd.md)`  
3. `[[aa.png]]`
4. `[aa](aa.png)`

# 说明
obsidian 中的所有文件尽量放到 *_posts* 文件夹下，本插件仅读取 posts 中的内容