#!/usr/bin/env node
const http = require('http');
const url=require('url');
const superagent=require('superagent');
const cheerio=require('cheerio');

var serverPort=process.env.PORT || 1314;

function parsetime(time) {
    return {
        hour: time.getHours(),
        minute: time.getMinutes(),
        second: time.getSeconds()
    }
}


function unixtime(time) {
    return { unixtime: time.getTime() }
    }




let path = 'http://www.qiushibaike.com/text/page/';
let page = 1;
let jokeStories=[]


function loadJokes(){
    if(jokeStories.length<3){

superagent
        .get(path+page)
        .end((err, res)=>{
            if(err) console.error(err)
            const $ = cheerio.load(res.text)
            const jokeList = $('.article .content span')
            jokeList.each(function(i, item){
                jokeStories.push($(this).text())
            })
            page++
        })
    }

return {"joke":jokeStories.shift()}
}


http.createServer(function (req, res) {

let parsedUrl = url.parse(req.url, true)
let result


function loadtranslator(){
const API = 'http://fanyi.youdao.com/openapi.do?keyfrom=toaijf&key=868480929&type=data&doctype=json&version=1.1';
var word=parsedUrl.query.word
var result={}
superagent
    .get(API)
    .query({ q: word})
    .end(function (err, res) {
            if(err){
                console.log('翻译失败，请重试！')
                return false
            }
            let data = JSON.parse(res.text)
            //console.log("json解析结果"+data);
            if(data.basic){
                result[word] = data['basic']['explains']
            }else if(data.translation){
                result[word] = data['translation']
            }else {
                console.error('error')
            }
        console.log("==="+result);
        })
        return JSON.stringify(result);
}

if(req.url=='/'){
result = parsetime(new Date())
}





//判断api
else if (/^\/api\/joke/.test(req.url)) {

result=loadJokes();
}else if (/^\/api\/translator/.test(req.url)) {
result = loadtranslator()
}


if (result) {

res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' })

res.write("<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'>")
res.end(JSON.stringify(result))
} else {
res.writeHead(404)
res.end()
}



}).listen(serverPort);
