#!/usr/bin/env node
const cheerio=require('cheerio');//服务器端的jq
const superagent=require('superagent');//异步请求
const http=require('http');
const express=require('express');//框架
const eventproxy=require('eventproxy');//控制并发---666
const url=require('url');
const pg=require('pg');
//const async=require('async');

//class news-box-aa
 const hurl='http://history.sohu.com/1338';




//获取标题所在网址
var getTitleUrls=()=>{
var Urls=[];

superagent.get(hurl).end((err,sres)=>{
	if(err){
console.log("无法请求！");
	return false;
      } 
var $=cheerio.load(sres.text);
$('.news-box h4 a').each((i,item)=>{
var $item=$(item);
//console.log($item.attr('href').trim());

Urls.push({
title:$item.text().trim(),
href:url.resolve(hurl,$item.attr('href').trim()),
})
})

})
return {"titleUrls":Urls};
}

//保存网址
var titleUrls=getTitleUrls().titleUrls;

//数据库配置
var config={
user:"postgres",
database:"history",
password:"liulingxuan1208",
port:5432,
max:20, //连接池最大连接数
idleTimeoutMillis:3000,//连接最大空闲时间 3s
}

var pool=new pg.Pool(config);//创建连接池


//抽象 函数->插入数据
var insert=(href,author,title)=>{

pool.connect().then(client=>{
 client.query("insert into article(href,author,title) values($1::varchar,$2::varchar,$3::varchar)",[href,author,title]).then(res=>{
console.log("insert success!")
 return res; 
 })
pool.on("error",(err,client)=>{
console.log("error")
return false;

})
})

}




//app.set('title', '凌轩爬虫作品');
//console.log(titleUrls);

//console.log("titleUrls"+JSON.stringify(titleUrls));
setTimeout(function(){
console.log("titleUrls"+JSON.stringify(titleUrls));
},2000)



//主函数
var start=()=>{
var app=new express(); //获取实例

app.get("/",function(req,res,next){
var ep=new eventproxy();//获取实例

//遍历 获取作者  文章内容
titleUrls.forEach((titleUrl,index)=>{
var u=JSON.stringify(titleUrl.href);
//console.log(u+"\n========="+titleUrl.href);//哇  这里是真的险恶！！！
superagent.get(titleUrl.href)
.end((err,sres)=>{
if(err){
console.log("error"+titleUrl.href);
return false;
}

//控制异步
ep.emit("article_html",[titleUrl.href,sres.text]);
})
})

//异步回调
ep.after("article_html",titleUrls.length,function(pairs){
var article=[];

pairs=pairs.map((pair)=>{
var article_url=pair[0];
var article_html=pair[1];
var $=cheerio.load(article_html);


//插入文章数据
insert(article_url,$('#user-info h4 a').text().trim(),$('.text-title h1').text().trim());

});
});
res.set('Content-Type', 'text/html');
res.end();
})


//监听端口
app.listen(1111,()=>{
//console.log("扒取数据中。。。")
})
}





if (require.main === module) {
  // 如果是直接执行 main.js，则进入此处
  // 如果 main.js 被其他文件 require，则此处不会执行。
start();
}

exports.start = start;
exports.getTitleUrls=getTitleUrls;
