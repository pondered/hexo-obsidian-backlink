"use strict";

const log = require("hexo-log")({
    debug: false,
    silent: false
  })
const hexoFs = require("hexo-fs");
const fs = require("fs");
const path = require("path");

const priority = 10000;

// 获取所有md文件，并关联到 Hexo 变量中
hexo.extend.filter.register(
  "before_post_render",
  function (data) {
    if (hexo.files != undefined && hexo.files != null) {
      hexo.files.set(data.source.replace("_posts/", ""), data);
    } else {
      hexo.files = new Map();
      hexo.files.set(data.source.replace("_posts/", ""), data);
    }
  },
  priority + 10
);

// 获取所有 _posts 文件夹下所有文件，并关联到 Hexo 变量中
hexo.extend.filter.register(
  "before_post_render",
  function (data) {
    if (hexo.allFile == undefined || hexo.allFile == null) {
      let allFile = hexoFs
        .listDirSync(path.join(hexo.source_dir, "_posts"), {
          ignorePattern: /node_modules/,
        })
        .map((each) => {
          let array = (each + "").split(path.sep);
          // For Windows
          if (path.sep === "\\") {
            each = each.replace(new RegExp("\\" + path.sep, "g"), "/");
          }
          return {
            info: hexo.files.get(each),
            fileName: array.length === 0 ? "" : array[array.length - 1],
            filePath: each,
            articleName: each.replace(/\.md$/, ""),
            fileExt: each.substr(each.lastIndexOf(".")),
          };
        });
      hexo.allFile = allFile;
    }
  },
  priority + 20
);

// 替换所有 双链的附件为 markdown标准的附件格式
hexo.extend.filter.register(
  "before_post_render",
  function (data) {
    function unique(arr) {
      return arr.filter(function (item, index, arr) {
        //当前元素，在原始数组中的第一个索引==当前索引值，否则返回当前元素
        return arr.indexOf(item, 0) === index;
      });
    }
    const regexHasExtension = /^([^\\]*)\.(\w+)$/;
    const regexWiki = /\[\[([^\]]+)\]\]/;
    const regexWikiGlobal = /\[\[([^\]]*)\]\]/g;

    let content = data.content;
    let wikiMatches = content.match(regexWikiGlobal);

    if (wikiMatches) {
      wikiMatches = unique(wikiMatches);
      for (const item of wikiMatches) {
        let text = item.match(regexWiki)[1];
        const matches = text.match(regexHasExtension);
        let newText = text;
        if (matches) {
          const filename = matches[1];
          const extension = matches[2];
        } else {
          newText = newText + ".md";
        }
        const encodedText = encodeURI(newText);
        let newItem = `[${text}](${encodedText})`;
        content = content.replaceAll(item, newItem);
      }
    }
    data.content = content;
  },
  priority + 30
);

// 将所有 markdown 链接 在转换为 指向具体文件的链接
hexo.extend.filter.register(
  "before_post_render",
  function (data) {
    function unique(arr) {
      return arr.filter(function (item, index, arr) {
        //当前元素，在原始数组中的第一个索引==当前索引值，否则返回当前元素
        return arr.indexOf(item, 0) === index;
      });
    }
    const allFile = hexo.allFile;
    const regexHasExtension = /^([^\\]*)\.(\w+)$/;
    const regexParenthesis = /\((.*?)\)/;
    const regexMdGlobal = /\[([^\]]*)\]\(([^\(]*)\)/g;
    // md 链接 分段
    const regexMdLink = /\[([\s\S]*?)\]\(([\s\S]*?)\)/;

    let content = data.content;
    let mdMatches = content.match(regexMdGlobal);

    if (mdMatches) {
      mdMatches = unique(mdMatches);
      for (const item of mdMatches) {
        // 过滤正常链接
        const mdLink = regexMdLink.exec(item)
        if(!mdLink){
            log.error("%s format err", item)
        }
        const title = mdLink[1];
        if (/^http/.test(mdLink[2])) {
            continue;
        }

        // const title = item.match(regexMdTitle);
        let text = item.match(regexParenthesis)[1];
        if(text.startsWith("../")){
            text = path.resolve(data.slug, "../"+text).replace(this.base_dir, "")
        }
        text = decodeURI(text);

        let realFilePath = allFile.find((file) => file.filePath === text);
        if (!realFilePath) {
          realFilePath = allFile.find((file) => file.fileName === text);
        }
        if(!realFilePath){
            realFilePath = allFile.find((file)=>file.filePath === path.resolve(data.slug, "../"+text).replace(this.base_dir, ""))
        }
        if(!realFilePath){
            log.error("file: %s  asset: %s not found", item, text)
        }

        if (realFilePath) {
          const matches = text.match(regexHasExtension);
          if (matches) {
            const filename = matches[1];
            const extension = matches[2];
            if (extension == "md") {
              const postLink = `<a href="/${realFilePath.info.path}">${title}</a>`;
              content = content.replaceAll("!"+item, postLink).replaceAll(item, postLink);
            } else {
              // 附件
              // const assetLink = `{% asset_link ${filename} %}`
              // content = content.replaceAll(item, assetLink);
            }
          } else {
            const postLink = `<a href="/${realFilePath.info.path}">${title}</a>`;
            content = content.replaceAll(item, postLink);
          }
        }
      }
    }
    data.content = content;
  },
  priority + 40
);

// 接下来所有的 链接文件都为 附件
// 将md的内容复制到 images 文件夹下，并指向这个链接
let assetMaps = new Map();
hexo.extend.filter.register(
  "before_post_render",
  function (data) {
    function unique(arr) {
      return arr.filter(function (item, index, arr) {
        //当前元素，在原始数组中的第一个索引==当前索引值，否则返回当前元素
        return arr.indexOf(item, 0) === index;
      });
    }

    const assetFile = function (path, title, extension) {
        if ([".mp4", ".webm", ".ogg"].includes(extension)) {
        return `<img src="www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png" alt="${title}">`
        } else {
            return `<img src="${path}" alt="${title}">`
        }
    };

    const allFile = hexo.allFile;
    //
    const regexParenthesis = /\((.*?)\)/;
    // 扩展名
    const regexHasExtension = /^([^\\]*)\.(\w+)$/;
    // md 链接数据
    const regexMdGlobal = /\[([^\]]*)\]\(([^\(]*)\)/g;
    // md 链接 分段
    const regexMdLink = /\[([\s\S]*?)\]\(([\s\S]*?)\)/;
    const dir_source = this.source_dir;
    const assetSource = dir_source + "_posts/";
    const dir_public = this.public_dir;
    const dir_images = path.join(dir_public, data.path, "images");

    let content = data.content;
    let mdMatches = content.match(regexMdGlobal);

    if (mdMatches) {
      mdMatches = unique(mdMatches);
      for (const item of mdMatches) {
        // 过滤正常链接
        const mdLink = regexMdLink.exec(item)
        if(!mdLink){
            log.error("%s format err", item)
        }
        const title = mdLink[1];
        if (/^http/.test(mdLink[2])) {
            continue;
        }

        let text = item.match(regexParenthesis)[1];
        text = decodeURI(text);

        let realFilePath = allFile.find((file) => file.filePath === text);
        if (!realFilePath) {
          realFilePath = allFile.find((file) => file.fileName === text);
        }
        if(!realFilePath){
            realFilePath = allFile.find((file)=>file.filePath === path.resolve(data.slug, "../"+text).replace(this.base_dir, ""))
        }
        if(!realFilePath){
            log.error("file: %s  asset: %s not found", item, text)
        }

        if (!assetMaps.has(item)) {
          const matches = text.match(regexHasExtension);
          if(!matches){
            log.error("%s %s no extension", text)
          }
          const extension = matches[2];
          if (realFilePath) {
            hexoFs.copyFile(assetSource+realFilePath.filePath,path.join(dir_images, path.basename(realFilePath.fileName)));
            const href = assetFile(`/${data.path +encodeURI("images/" + path.basename(realFilePath.fileName))}`,title, extension);
            content = content.replaceAll("!"+item, href).replaceAll(item, href);
            assetMaps.set(item, href);
            // 附件
          }
        } else {
          content = content.replaceAll("!"+item, assetMaps.get(item)).replaceAll(item, assetMaps.get(item));
        }
      }
    }
    data.content = content;
  },
  priority + 50
);
