const http = require('http');
const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const xml2js = require('xml2js');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var parser = new xml2js.Parser();
var builder = new xml2js.Builder();
app.post('/server/save', function (req, res) {
    //读取xml文件
    fs.readFile('./static/tour.xml', 'utf8', function (err, data) {
        if (err) throw err;
        //xml转对象
        parser.parseString(data, function (parseErr, obj) {
            if (parseErr) throw parseErr;
            //根据请求参数修改dom节点
            var scenes = req.body[0];
            scenes.forEach(function (scene) {
                var sceneObj = obj.krpano.scene[scene.index];
                //初始观察点
                var viewAttr = sceneObj.view[0].$;
                if (scene.initH) viewAttr.hlookat = scene.initH;
                if (scene.initV) viewAttr.vlookat = scene.initV;
                if (scene.fov) viewAttr.fov = scene.fov;
                if (scene.fovmax) viewAttr.fovmax = scene.fovmax;
                if (scene.fovmin) viewAttr.fovmin = scene.fovmin;
                delete viewAttr.maxpixelzoom;
                //场景名称
                sceneObj.$.name = scene.name;
                //热点
                if (scene.hotSpots) {
                    sceneObj.hotspot = [];
                    scene.hotSpots.forEach(function (hotSpot) {
                        sceneObj.hotspot.push({
                            $: {
                                ath: hotSpot.ath,
                                atv: hotSpot.atv,
                                linkedscene: hotSpot.linkedscene,
                                name: hotSpot.name,
                                title: hotSpot.title,
                                style: hotSpot.style,
                                dive: hotSpot.dive,
                            },
                        });
                    });
                }
                //自动旋转
                if (scene.autorotate) {
                    sceneObj.autorotate = [
                        {
                            $: {
                                enabled: scene.autorotate.enabled,
                                waittime: scene.autorotate.waitTime,
                                accel: '1.0',
                                speed: '5.0',
                                horizon: '0.0',
                            },
                        },
                    ];
                }
                //初始场景
                if (scene.welcomeFlag) {
                    obj.krpano.action[0]._ =
                        'if(startscene === null OR !scene[get(startscene)], copy(startscene,scene[' +
                        scene.index +
                        "].name); );loadscene(get(startscene), null, MERGE);if(startactions !== null, startactions() );js('onready');";
                }
            });
            //根据请求参数修改layer节点
            var sandSpotList = req.body[1];
            var dInfo = '';
            sandSpotList.forEach(function (spot) {
                dInfo = dInfo + ',' + spot.name;
                obj.krpano.layer.push({
                    $: {
                        name: spot.name,
                        parent: 'map',
                        keep: spot.keep,
                        url: spot.url,
                        align: spot.align,
                        scale: spot.scale,
                        x: spot.x,
                        y: spot.y,
                        ondown: spot.ondown,
                        onclick: spot.onclick,
                    },
                });
            });
            //对象转回xml
            var xmlStr = builder.buildObject(obj);
            //写入文件
            fs.writeFile('./static/tour.xml', xmlStr, 'utf8', function (err) {
                if (err) throw err;
                res.send(dInfo);
            });
        });
    });
});

app.use('/', express.static(__dirname + '/static'));

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
