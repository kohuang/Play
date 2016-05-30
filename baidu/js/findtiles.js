(function(){
var EARTHRADIUS = 6370996.81;
var MCBAND = [ 12890594.86, 8362377.87, 5591021, 3481989.83,
        1678043.12, 0 ];
var LLBAND = [ 75, 60, 45, 30, 15, 0 ];
var MC2LL = [
        [ 1.410526172116255e-8, 0.00000898305509648872,
-1.9939833816331, 200.9824383106796,
-187.2403703815547, 91.6087516669843,
-23.38765649603339, 2.57121317296198,
-0.03801003308653, 17337981.2 ],
        [ -7.435856389565537e-9, 0.000008983055097726239,
-0.78625201886289, 96.32687599759846,
-1.85204757529826, -59.36935905485877,
47.40033549296737, -16.50741931063887,
2.28786674699375, 10260144.86 ],
        [ -3.030883460898826e-8, 0.00000898305509983578,
0.30071316287616, 59.74293618442277,
7.357984074871, -25.38371002664745,
13.45380521110908, -3.29883767235584,
0.32710905363475, 6856817.37 ],
        [ -1.981981304930552e-8, 0.000008983055099779535,
0.03278182852591, 40.31678527705744,
0.65659298677277, -4.44255534477492,
0.85341911805263, 0.12923347998204,
-0.04625736007561, 4482777.06 ],
        [ 3.09191371068437e-9, 0.000008983055096812155,
0.00006995724062, 23.10934304144901,
-0.00023663490511, -0.6321817810242,
-0.00663494467273, 0.03430082397953,
-0.00466043876332, 2555164.4 ],
        [ 2.890871144776878e-9, 0.000008983055095805407,
-3.068298e-8, 7.47137025468032,
-0.00000353937994, -0.02145144861037,
-0.00001234426596, 0.00010322952773,
-0.00000323890364, 826088.5 ] ];


var LL2MC = [
        [ -0.0015702102444, 111320.7020616939,
1704480524535203, -10338987376042340,
26112667856603880, -35149669176653700,
26595700718403920, -10725012454188240,
1800819912950474, 82.5 ],
        [ 0.0008277824516172526, 111320.7020463578,
647795574.6671607, -4082003173.641316,
10774905663.51142, -15171875531.51559,
12053065338.62167, -5124939663.577472,
913311935.9512032, 67.5 ],
        [ 0.00337398766765, 111320.7020202162,
4481351.045890365, -23393751.19931662,
79682215.47186455, -115964993.2797253,
97236711.15602145, -43661946.33752821,
8477230.501135234, 52.5 ],
        [ 0.00220636496208, 111320.7020209128,
51751.86112841131, 3796837.749470245,
992013.7397791013, -1221952.21711287,
1340652.697009075, -620943.6990984312,
144416.9293806241, 37.5 ],
        [ -0.0003441963504368392, 111320.7020576856,
278.2353980772752, 2485758.690035394,
6070.750963243378, 54821.18345352118,
9540.606633304236, -2710.55326746645,
1405.483844121726, 22.5 ],
        [ -0.0003218135878613132, 111320.7020701615,
0.00369383431289, 823725.6402795718,
0.46104986909093, 2351.343141331292,
1.58060784298199, 8.77738589078284,
0.37238884252424, 7.45 ] ];



function Point(lng, lat){
    this.lng = lng;
    this.lat = lat;
}

function convertor (point, ll2mc) {
    if (!point || !ll2mc) {
        return
    }
    // 经度的转换比较简单，一个简单的线性转换就可以了。
    // 0、1的数量级别是这样的-0.0015702102444, 111320.7020616939
    var x = ll2mc[0] + ll2mc[1] * Math.abs(point.lng);
    // 先计算一个线性关系，其中9的数量级是这样的：67.5，a的估值大约是一个个位数
    var a = Math.abs(point.lat) / ll2mc[9];
    // 维度的转换相对比较复杂，y=b+ca+da^2+ea^3+fa^4+ga^5+ha^6
    // 其中，a是维度的线性转换，而最终值则是一个六次方的多项式，2、3、4、5、6、7、8的数值大约是这样的：
    // 278.2353980772752, 2485758.690035394,
    // 6070.750963243378, 54821.18345352118,
    // 9540.606633304236, -2710.55326746645,
    // 1405.483844121726,
    // 这意味着维度会变成一个很大的数，大到多少很难说
    var y = ll2mc[2] + ll2mc[3] * a + ll2mc[4] * a * a + ll2mc[5] * a
    * a * a + ll2mc[6] * a * a * a * a + ll2mc[7] * a
    * a * a * a * a + ll2mc[8] * a * a * a * a
    * a * a;
    // 整个计算是基于绝对值的，符号位最后补回去就行了
    x *= (point.lng < 0 ? -1 : 1);
    y *= (point.lat < 0 ? -1 : 1);
    // 产生一个新的点坐标。果然不一样了啊
    return new Point(x, y)
}

function lngLatToMercator(T) {
    return convertLL2MC(T);
}

function getLoop(value, min, max) {
    while (value > max) {
        value -= max - min
    }
    while (value < min) {
        value += max - min
    }
    return value
}

function convertLL2MC (point) {
    var point1;
    var ll2mc;
    point.lng = getLoop(point.lng, -180, 180);// 标准化到区间内
    point.lat = getRange(point.lat, -74, 74);// 标准化到区间内
    point1 = new Point(point.lng, point.lat);
    // 查找LLBAND的维度字典，字典由大到小排序，找到则停止
    for (var i = 0; i < LLBAND.length; i++) {
        if (point1.lat >= LLBAND[i]) {
            ll2mc = LL2MC[i];
            break;
        }
    }
    // 如果没有找到，则反过来找。找到即停止。
    if (!ll2mc) {
        for (var i = LLBAND.length - 1; i >= 0; i--) {
            if (point1.lat <= -LLBAND[i]) {
ll2mc = LL2MC[i];
break;
            }
        }
    }
    var newPoint = convertor(point, ll2mc);
    var point = new Point(newPoint.lng.toFixed(2), newPoint.lat.toFixed(2));
    return point;
}

function findAllTiles(map, callback){
    var mapType = map.getMapType();// 地图类型
    var zoomLevel = map.zoomLevel;// 放大倍数
    var center = map.mercatorCenter;// 中心坐标
    this.mapCenterPoint = center;
    var cV = mapType.getZoomUnits(zoomLevel);// zoomLevel相关的一个指数，=2^(18-zoomLevel)
    var unitSize = mapType.getZoomFactor(zoomLevel);// 一个系数，=cV*256
    var longitudeUnits = Math.ceil(center.lng / unitSize);// center.lng是一个很大的数
    var latitudeUnits = Math.ceil(center.lat / unitSize);
    var tileSize = mapType.getTileSize();
    var cP = [ longitudeUnits, latitudeUnits, (center.lng - longitudeUnits * unitSize) / unitSize * tileSize,
            (center.lat - latitudeUnits * unitSize) / unitSize * tileSize ];
    var width0 = cP[0] - Math.ceil((map.width / 2 - cP[2]) / tileSize);
    var height0 = cP[1] - Math.ceil((map.height / 2 - cP[3]) / tileSize);
    var width = cP[0] + Math.ceil((map.width / 2 + cP[2]) / tileSize);
    var c0 = 0;
    if (mapType === BMAP_PERSPECTIVE_MAP && map.getZoom() == 15) {
        c0 = 1
    }
    var height = cP[1] + Math.ceil((map.height / 2 + cP[3]) / tileSize) + c0;
    var xydata = [];
    for (var i = width0; i < width; i++) {
        for (var j = height0; j < height; j++) {
            xydata.push([ i, j ])
        }
    }
    var zoom = map.getZoom();
    //var win = window.open();
    for (var i = 0, len = xydata.length; i < len; i++) {
        showTile([ xydata[i][0], xydata[i][1], zoom ], callback)
    }    
    
}

function findAllTiles4local(map, ozoomLevel){
    var mapType = map.getMapType();// 地图类型
    var zoomLevel = ozoomLevel || map.zoomLevel;// 放大倍数
    var center = map.mercatorCenter;// 中心坐标
    this.mapCenterPoint = center;
    var cV = mapType.getZoomUnits(zoomLevel);// zoomLevel相关的一个指数，=2^(18-zoomLevel)
    var unitSize = mapType.getZoomFactor(zoomLevel);// 一个系数，=cV*256
    var longitudeUnits = Math.ceil(center.lng / unitSize);// center.lng是一个很大的数
    var latitudeUnits = Math.ceil(center.lat / unitSize);
    var tileSize = mapType.getTileSize();
    var cP = [ longitudeUnits, latitudeUnits, (center.lng - longitudeUnits * unitSize) / unitSize * tileSize,
            (center.lat - latitudeUnits * unitSize) / unitSize * tileSize ];
    var width0 = cP[0] - Math.ceil((map.width / 2 - cP[2]) / tileSize);
    var height0 = cP[1] - Math.ceil((map.height / 2 - cP[3]) / tileSize);
    var width = cP[0] + Math.ceil((map.width / 2 + cP[2]) / tileSize);
    var c0 = 0;
    if (mapType === BMAP_PERSPECTIVE_MAP && map.getZoom() == 15) {
        c0 = 1
    }
    var height = cP[1] + Math.ceil((map.height / 2 + cP[3]) / tileSize) + c0;
    var xydata = [];
    for (var i = width0; i < width; i++) {
        for (var j = height0; j < height; j++) {
            xydata.push([ i, j ])
        }
    }
    var zoom = map.getZoom();
    //var win = window.open();
    var tiles = [];
    for (var i = 0, len = xydata.length; i < len; i++) {
        var xyz = [ xydata[i][0], xydata[i][1], zoom ];
        tiles.push({
            xyz : xyz,
            url : getTilesUrl({x:xyz[0],y:xyz[1]}, xyz[2])
        });
    }    
    return tiles;
}

function showTile(xyz, callback){
    console.log(xyz[2]+"/"+xyz[0]+"/"+xyz[1]);
    if(!!callback){
        callback(xyz, getTilesUrl({x:xyz[0],y:xyz[1]}, xyz[2]));
    }
}


var j = [ "http://online0.map.bdimg.com/tile/",
            "http://online1.map.bdimg.com/tile/",
            "http://online2.map.bdimg.com/tile/",
            "http://online3.map.bdimg.com/tile/",
            "http://online4.map.bdimg.com/tile/" ];

            
    function getTilesUrl(xy, z) {
        var x = xy.x;
        var y = xy.y;
        var udt = "20150518";
        var style = "pl";
        // if (this.map.highResolutionEnabled()) {
        //style = "ph"
        // }
        var cM = j[Math.abs(x + y) % j.length] + "?qt=tile&x="
                + (x + "").replace(/-/gi, "M") + "&y="
                + (y + "").replace(/-/gi, "M") + "&z=" + z + "&styles=" + style
                + "&udt=" + udt;
        // 这个地方废弃了上面的计算结果，直接采用本地图片
        //cM = "maptile/" + z + "/" + x + "/" + y + ".jpg";
        return cM.replace(/-(\d+)/gi, "M$1")
    }
    window.mapUtils = {
        findAllTiles : findAllTiles,
        findAllTiles4local : findAllTiles4local
    };
    
}())

var nanjing_boundary = ["119.147396, 31.451172;119.147626, 31.457387;119.155461, 31.464263;119.162336, 31.481678;119.162304, 31.486827;119.155349, 31.49063;119.156879, 31.496398;119.15946, 31.499533;119.172845, 31.499808;119.179149, 31.504643;119.19004, 31.506324;119.203972, 31.526649;119.189396, 31.53376;119.189134, 31.546082;119.195206, 31.557594;119.204647, 31.557852;119.212171, 31.562849;119.213076, 31.56887;119.222426, 31.57607;119.225005, 31.584546;119.222546, 31.590837;119.235318, 31.617271;119.240656, 31.632783;119.239104, 31.637992;119.219036, 31.633404;119.218389, 31.639124;119.212805, 31.642835;119.21132, 31.6524;119.193823, 31.655211;119.199334, 31.665101;119.192572, 31.677536;119.19695, 31.693067;119.192954, 31.700201;119.163847, 31.705982;119.145188, 31.728284;119.135825, 31.729598;119.13156, 31.741713;119.121033, 31.74601;119.115491, 31.752556;119.11742, 31.757067;119.101021, 31.761297;119.096253, 31.775664;119.092378, 31.779704;119.084071, 31.779999;119.083665, 31.78983;119.072255, 31.788041;119.062107, 31.795229;119.05321, 31.794888;119.041397, 31.790012;119.034333, 31.79052;119.021677, 31.780942;119.012977, 31.784761;119.005457, 31.773021;118.987506, 31.773816;118.989405, 31.788963;119.00948, 31.789319;119.014411, 31.798312;119.013153, 31.804704;119.004522, 31.808776;118.994918, 31.823248;118.979629, 31.82859;118.976079, 31.840311;118.984465, 31.841931;118.986302, 31.848011;119.036431, 31.854505;119.040106, 31.860406;119.049807, 31.860792;119.052301, 31.86476;119.075475, 31.875195;119.079904, 31.870041;119.101047, 31.865819;119.107064, 31.87246;119.110669, 31.88603;119.115849, 31.890615;119.124416, 31.892156;119.126011, 31.89726;119.125595, 31.903644;119.117899, 31.907031;119.115053, 31.92868;119.108022, 31.938724;119.098071, 31.937525;119.07489, 31.94548;119.054033, 31.942732;119.041638, 31.948253;119.0358, 31.95659;119.035715, 31.963415;119.05309, 31.975012;119.0714, 31.979533;119.08154, 31.975278;119.089448, 31.980036;119.096742, 31.979838;119.112303, 31.970836;119.1175, 31.974793;119.120509, 31.98559;119.12748, 31.986385;119.128206, 31.990683;119.120919, 31.993639;119.119066, 32.006165;119.110651, 32.010473;119.106451, 32.007985;119.098962, 32.009794;119.104511, 32.016886;119.093202, 32.05864;119.10516, 32.077276;119.106815, 32.094483;119.104042, 32.097603;119.096383, 32.095399;119.093003, 32.097978;119.086351, 32.113152;119.076235, 32.114012;119.064137, 32.108463;119.060157, 32.110458;119.053517, 32.107846;119.046892, 32.114746;119.047366, 32.119337;119.014788, 32.120269;119.017539, 32.131831;119.026786, 32.135426;119.039657, 32.156897;119.050029, 32.165458;119.082582, 32.167576;119.08552, 32.184844;119.125468, 32.192353;119.141716, 32.199784;119.161276, 32.192695;119.190798, 32.196084;119.197997, 32.191474;119.203893, 32.191509;119.222663, 32.196924;119.226351, 32.205723;119.242031, 32.216198;119.247036, 32.225619;119.241592, 32.229125;119.230993, 32.229202;119.148198, 32.250854;119.112839, 32.250039;119.094349, 32.246284;119.082998, 32.253653;119.068795, 32.249321;119.043509, 32.266229;119.047491, 32.27807;119.042787, 32.300983;119.046449, 32.30975;119.04205, 32.315071;119.043613, 32.333236;119.048398, 32.33965;119.03488, 32.351378;119.033753, 32.357628;119.042474, 32.362194;119.050678, 32.372882;119.029504, 32.383556;119.031781, 32.386499;119.044828, 32.387936;119.045429, 32.391203;119.043582, 32.395495;119.02963, 32.397165;119.028545, 32.402645;119.024029, 32.405397;119.022971, 32.419302;119.03595, 32.435146;119.028549, 32.447643;119.030203, 32.456972;119.037218, 32.461503;119.042358, 32.458787;119.053185, 32.469647;119.073963, 32.468466;119.070922, 32.488471;119.052249, 32.504396;119.047585, 32.521352;119.026271, 32.524651;119.014063, 32.520024;119.012411, 32.514868;119.004023, 32.509682;118.981657, 32.511988;118.975595, 32.533405;118.951424, 32.549602;118.942924, 32.564302;118.923048, 32.562725;118.920942, 32.55519;118.91284, 32.558531;118.912592, 32.564281;118.905799, 32.559185;118.894449, 32.560821;118.901024, 32.567777;118.905152, 32.566634;118.903639, 32.582235;118.915644, 32.592805;118.91427, 32.598765;118.902497, 32.592303;118.891642, 32.592275;118.887812, 32.584459;118.880008, 32.588524;118.880368, 32.582202;118.862592, 32.580035;118.850105, 32.57281;118.8512, 32.580629;118.842699, 32.576569;118.833568, 32.578746;118.825776, 32.590266;118.832033, 32.601471;118.83142, 32.607999;118.827463, 32.610473;118.811757, 32.599779;118.808675, 32.590866;118.79123, 32.588705;118.780687, 32.593911;118.78203, 32.604131;118.769479, 32.609556;118.750952, 32.604526;118.748889, 32.596502;118.742117, 32.59446;118.732625, 32.602042;118.731755, 32.614367;118.72537, 32.618713;118.723944, 32.615883;118.70413, 32.612265;118.707333, 32.594705;118.702996, 32.594698;118.701117, 32.603267;118.693661, 32.611479;118.698287, 32.599614;118.695985, 32.594862;118.677834, 32.601049;118.668497, 32.599845;118.664353, 32.605161;118.639981, 32.583381;118.630451, 32.598083;118.608383, 32.603166;118.604648, 32.607207;118.575571, 32.5923;118.570181, 32.57073;118.584775, 32.558756;118.612451, 32.546025;118.615494, 32.542493;118.611104, 32.52862;118.621077, 32.526088;118.623429, 32.521393;118.621952, 32.514166;118.614603, 32.507474;118.601638, 32.508671;118.598991, 32.506163;118.599848, 32.487879;118.63472, 32.473338;118.640887, 32.477015;118.64999, 32.476365;118.654229, 32.482496;118.67897, 32.475751;118.697382, 32.478522;118.698104, 32.459713;118.692466, 32.434236;118.695103, 32.406439;118.684705, 32.398222;118.694444, 32.391076;118.697995, 32.383717;118.702381, 32.389332;118.708187, 32.386295;118.704741, 32.381237;118.710051, 32.375774;118.703131, 32.372719;118.70698, 32.364474;118.699891, 32.360493;118.705715, 32.355751;118.70327, 32.349427;118.713157, 32.345512;118.714052, 32.33938;118.709624, 32.335619;118.690488, 32.333128;118.691495, 32.329916;118.70373, 32.325508;118.702387, 32.323215;118.683603, 32.322074;118.66514, 32.309005;118.666592, 32.303173;118.675321, 32.301884;118.67757, 32.292748;118.667706, 32.270443;118.6825, 32.261471;118.683669, 32.256469;118.652856, 32.216262;118.635816, 32.207738;118.622744, 32.210067;118.601533, 32.202573;118.576623, 32.207806;118.567162, 32.203753;118.558481, 32.204898;118.546244, 32.199355;118.536764, 32.201389;118.52958, 32.195346;118.516517, 32.200075;118.515014, 32.189943;118.502245, 32.182718;118.502273, 32.170857;118.515613, 32.143384;118.504634, 32.144848;118.50541, 32.139811;118.501179, 32.136955;118.507166, 32.127212;118.482753, 32.123886;118.479286, 32.121728;118.479214, 32.115881;118.469439, 32.107649;118.455509, 32.104249;118.438027, 32.092903;118.421833, 32.09403;118.41833, 32.087464;118.411198, 32.085806;118.410358, 32.081522;118.401416, 32.082112;118.400728, 32.070392;118.391688, 32.066094;118.400939, 32.054731;118.394621, 32.047923;118.39259, 32.038789;118.394766, 32.032718;118.402415, 32.028097;118.396248, 32.017731;118.397612, 31.99524;118.393793, 31.988938;118.381344, 31.985977;118.386597, 31.974024;118.374397, 31.961258;118.369429, 31.937819;118.383277, 31.92996;118.391894, 31.916664;118.409497, 31.919607;118.425882, 31.904032;118.434558, 31.902514;118.444688, 31.905087;118.454319, 31.895251;118.47862, 31.885638;118.472514, 31.866539;118.481421, 31.857309;118.49689, 31.84939;118.511281, 31.847436;118.490309, 31.794592;118.491096, 31.785576;118.496669, 31.781898;118.509807, 31.783711;118.517358, 31.77134;118.530153, 31.767893;118.540352, 31.773332;118.551938, 31.768435;118.553799, 31.765294;118.547957, 31.764155;118.544955, 31.756426;118.535924, 31.754553;118.528698, 31.748932;118.536553, 31.748338;118.537649, 31.742353;118.54279, 31.744705;118.550584, 31.73785;118.555126, 31.743499;118.561209, 31.734576;118.578155, 31.752546;118.581766, 31.747196;118.585837, 31.746877;118.609267, 31.760771;118.623234, 31.755395;118.630781, 31.762592;118.638573, 31.763213;118.648508, 31.755687;118.64444, 31.748077;118.652456, 31.745091;118.654947, 31.736528;118.674403, 31.734758;118.687359, 31.729113;118.690129, 31.710369;118.683565, 31.705178;118.672771, 31.703127;118.675136, 31.69629;118.669693, 31.693951;118.668049, 31.687888;118.648174, 31.687368;118.647416, 31.680802;118.65456, 31.671292;118.646369, 31.661278;118.65162, 31.657684;118.651551, 31.652841;118.693111, 31.642265;118.718103, 31.64835;118.725882, 31.63343;118.731528, 31.63314;118.731881, 31.636771;118.739421, 31.638465;118.748982, 31.647277;118.746791, 31.651294;118.753419, 31.660604;118.750513, 31.668672;118.754732, 31.681427;118.76669, 31.686086;118.774832, 31.683473;118.780648, 31.688708;118.804586, 31.675025;118.79902, 31.665729;118.789385, 31.662474;118.799255, 31.642047;118.796889, 31.636404;118.802469, 31.634668;118.809508, 31.625615;118.820988, 31.625505;118.827081, 31.62943;118.826022, 31.634718;118.839754, 31.636537;118.854817, 31.629767;118.864809, 31.62984;118.875337, 31.617076;118.877397, 31.60505;118.86854, 31.599105;118.883749, 31.596051;118.8782, 31.579963;118.888521, 31.571021;118.879466, 31.551184;118.880613, 31.538024;118.890463, 31.537388;118.892802, 31.533618;118.889749, 31.502378;118.872749, 31.450968;118.875957, 31.428655;118.85813, 31.401955;118.845424, 31.394039;118.841358, 31.390018;118.842764, 31.387459;118.816456, 31.376901;118.776924, 31.370767;118.779132, 31.380994;118.773141, 31.393506;118.763709, 31.391752;118.75138, 31.37478;118.745573, 31.357743;118.727757, 31.331689;118.715597, 31.30628;118.707724, 31.303637;118.699751, 31.305015;118.725885, 31.285036;118.762892, 31.276068;118.775131, 31.264627;118.784072, 31.246898;118.794647, 31.240085;118.807982, 31.235565;118.81486, 31.240905;118.825927, 31.24208;118.831427, 31.235911;118.837802, 31.235331;118.858179, 31.245977;118.876885, 31.248175;118.904315, 31.244413;118.922137, 31.250624;118.952889, 31.241724;118.98811, 31.244187;118.993096, 31.236836;118.997991, 31.236067;119.025694, 31.247933;119.029362, 31.244415;119.045898, 31.244561;119.055297, 31.239883;119.074125, 31.243443;119.083023, 31.238112;119.091107, 31.245898;119.111856, 31.240308;119.113641, 31.256272;119.118583, 31.262006;119.138711, 31.268805;119.147122, 31.282233;119.156523, 31.283478;119.163939, 31.298857;119.180472, 31.299127;119.187398, 31.306352;119.194872, 31.307346;119.195368, 31.313851;119.202346, 31.31616;119.200243, 31.324343;119.205731, 31.33651;119.225867, 31.35409;119.220769, 31.361583;119.211092, 31.363633;119.206907, 31.374631;119.196289, 31.385345;119.180574, 31.387206;119.175616, 31.400356;119.175655, 31.427821;119.170845, 31.447256;119.161978, 31.444991;119.147396, 31.451172"];